# Reflecting on Eight Years at Atlassian

I was recently affected by the layoffs at Atlassian and wanted to take some
time to reflect on the eight years I spent there. I built a lot of things
during that time, and this is a chaptered write-up of the work I personally
found interesting or am proud of, along with some non-technical lessons.

If you are or were in a similar situation, I hope a few of these notes are
useful — either as inspiration for how to tackle similar problems, or as a
warning that helps you avoid some of the mistakes I made.

The chapters are independent, so feel free to skip to whatever is most
relevant to you.

## Table of Contents

1. [The Interview](#1-the-interview)
2. [First Project: The Open Service Broker](#2-first-project-the-open-service-broker)
3. [The Envoy Control Plane (Sovereign)](#3-the-envoy-control-plane-sovereign)
4. [Proxy Infrastructure: CloudFormation and AMIs](#4-proxy-infrastructure-cloudformation-and-amis)
5. [Migrating Atlassian's Products onto the Platform](#5-migrating-atlassians-products-onto-the-platform)
6. [Solving Concerns at the Edge](#6-solving-concerns-at-the-edge)
7. [Compliance Work](#7-compliance-work)
8. [Non-Technical: Diplomacy and Conflict](#8-non-technical-diplomacy-and-conflict)
9. [Non-Technical: Maintenance Over Time](#9-non-technical-maintenance-over-time)
10. [Non-Technical: Mentoring vs. Teaching](#10-non-technical-mentoring-vs-teaching)
11. [Closing Thoughts](#11-closing-thoughts)

---

## 1. The Interview

Eight years on, I still remember the interview process — and it was quite
different to what most companies do now. I was interviewed by people I now
consider friends, and my first impression was that these individuals were
genuinely sharp. That was exciting.

The process was roughly:

- **A HackerRank coding quiz**, which I aced with full marks.
- **A technical interview with two interviewers**, who handed me a white
  paper and left the room for about 10 minutes. When they came back, they
  asked me to articulate what was in it. The paper was Cloudflare's, about
  custom domains. They then asked some general questions about
  microservices, containers, and architecture.
- **A troubleshooting interview**, where I had to drive a debugging session
  by prompting the interviewer for information. It was a real Atlassian
  incident — an application bug that had led to a denial of service. I was
  also asked how latency-based DNS works. My answer wasn't quite right — I
  reasoned from first principles and assumed Route 53 measured client
  latency directly, when in reality it almost certainly leans on a
  geolocation database.
- **A values interview.** I don't remember most of it, but I do remember
  one question I asked the interviewer: *"If we fast-forward 12 months,
  what would I have to have achieved for you to look back and say hiring
  me was a good decision?"* The answer was concrete: build an application
  for the internal platform that would facilitate self-service load
  balancing for Atlassian's developers — conceptually similar to AWS ALBs,
  but tailored to the internal world. I said I could build it because I
  was confident with Python web apps at the time. They took my word for
  it, and hired me.

## 2. First Project: The Open Service Broker

There's a saying that joining Atlassian is like drinking from a firehose —
there's an overwhelming amount to absorb in the first few weeks.

The task I gave myself was to start building what I had promised in the
interview: an **Open Service Broker (OSB)**. The OSB spec is a public
standard — a web app with an API that brokers the provisioning of
resources for a platform, originally designed to live in a Kubernetes
world. The catalog endpoint lists the services and plans available; other
endpoints handle the lifecycle (provision, update, deprovision, bind).

At Atlassian, the workflow wasn't a click-ops console — provisioning
requests were defined in configuration files committed to version control,
then uploaded from a build server during service deploys.

The architecture I built was straightforward:

```
client → FastAPI (web) → SQS → worker → DynamoDB
                ↑________________________|
                  (status polled by client)
```

The web tier accepted requests but didn't do the provisioning itself — it
dropped the task on SQS. A worker picked it up, did the real work
(creating DNS records, CloudFront distributions, AWS API calls, etc.) and
wrote the result back to DynamoDB. The client polled until the task
completed or errored.

Implementation-wise, I started with [`connexion`][connexion], a Python
library that turns an OpenAPI document into route handlers. We later
migrated to plain Flask, and eventually to FastAPI — which is where it
still sits today, as far as I know.

[connexion]: https://github.com/spec-first/connexion

That's the broker in a nutshell. The more interesting parts came once I
started unraveling what "provisioning load balancing" actually meant.

## 3. The Envoy Control Plane (Sovereign)

One of the architects had an idea: replace Atlassian's commercial,
enterprise load balancers — with their associated licensing costs — with
an open-source, cloud-native commodity proxy. We chose [Envoy][envoy].

[envoy]: https://www.envoyproxy.io/

Envoy has an API that lets you reconfigure it dynamically at runtime. That
unlocks a model where you deploy a fleet of long-lived proxies, and when a
developer needs new configuration for their service, the change flows out
to the proxies on the fly.

That meant we needed a management server — Envoy calls this a **control
plane**. I built one and open-sourced it as **Sovereign** (the
repository is on Bitbucket).

The mental model:

```
                 broker DB  ─┐
                             │  (dynamic context)
                 S3, ...    ─┤
                             ▼
templates  ──────────▶  Sovereign  ──────▶  Envoy fleet
                       (FastAPI)         (xDS requests)
```

Sovereign is a FastAPI app that loads:

- **Templates** — one per Envoy resource type (clusters, listeners,
  routes, etc.).
- **Context** — the live data the templates render against.

When a proxy makes an xDS request, Sovereign pulls the current context
(from the broker, from S3 buckets, from anywhere it's configured to look),
renders it through the templates, and returns the resulting Envoy
configuration. As the context changes over time, the rendered
configuration changes, and the proxies pick it up.

So now the loop is complete: a developer's provisioning request lands in
the broker, the worker writes the new state to DynamoDB, Sovereign reads
that state on the next xDS request, renders templates, and the proxy
fleet's behaviour shifts to match.

## 4. Proxy Infrastructure: CloudFormation and AMIs

The proxies themselves had to come from somewhere. There were ~2,000 of
them across ~13 regions, and they were provisioned with **CloudFormation**.

The template was the usual collection of building blocks: VPC, subnets,
internet gateway, security group, key pair, IAM role, ASG, AMI reference,
ACM certificates, NLBs, Route 53 records. Nothing exotic — they're
ordinary AWS primitives, just assembled to produce a fleet of edge
proxies.

The interesting piece is the AMI. CloudFormation *references* it but
doesn't *build* it. That was a separate pipeline:

- A repository using **HashiCorp Packer**.
- Configuration management via **SaltStack** (conceptually similar to
  Puppet/Ansible/Chef — declarative "install these packages, render these
  files, run these services in this order").

Packer would spin up an EC2 instance in a dev account, upload the Salt
configuration, run the provisioning, and snapshot the result into an
AMI. The Salt states covered things like:

- Install and configure Envoy.
- Install and configure the observability agent (logging, tracing,
  metrics).
- Security hardening.
- Network tuning.
- Container runtime, for the sidecars I'll describe shortly.

At runtime, the ASG passed in parameters — secrets, keys, region-specific
configuration — and the instances came up, fetched their resources from
Sovereign, and started accepting traffic.

That was, roughly, the first 24 months of my time at Atlassian. By the
end of it: a developer who wanted their service exposed on the internet,
with the fancy routing features, could ship a config change, the broker
would handle the provisioning, Sovereign would render new templates, and
the proxy fleet would react. End to end, self-service.

## 5. Migrating Atlassian's Products onto the Platform

With the foundation in place, the next two big tracks of work were:

1. **Making the platform powerful enough for the big products** — Jira,
   Confluence, Bitbucket, Statuspage, and others all had their own
   special cases that a generic multi-tenant platform had to handle.
2. **Migrating every microservice onto it.** This was relatively easier
   because we could enforce it via the platform itself. Previously,
   services could be exposed publicly through a very basic load balancer
   — sometimes essentially by accident. We removed that path. To expose a
   service publicly, you now had to go through the centralised edge
   infrastructure and explicitly configure it — making the public-facing
   intent explicit, and giving us a chokepoint where protections could
   live.

This migration push took a couple of years. Many platform features were
built specifically to unblock specific products.

## 6. Solving Concerns at the Edge

Once the migrations were done and a lot of the per-product specialness
was supported, the bigger payoff started to show up.

We had a chokepoint:

```
customer → NLB → Envoy → backend service
```

Every request passed through Envoy on the way in. Whatever concerns we
could solve *there* didn't need to be solved on a bazillion backend
services. That saved time, money, and — most importantly — meant
individual product teams could focus on product work rather than
re-implementing the same cross-cutting infrastructure.

The concerns we centralised:

- **DoS protection** — provided via CloudFront, spearheaded by a
  colleague.
- **Access logs** — done natively inside Envoy via the HTTP Connection
  Manager's access log configuration. Developers supplied a small bit of
  JSON, our templates rendered the whole thing.
- **Authentication** — implemented as a sidecar that Envoy called via
  ext_authz / ext_proc. I wrote this one in Rust.
- **Authorization** — sidecar contributed by another team.
- **Rate limiting** — sidecar contributed by another team.

The sidecar model meant Envoy stayed focused on being a proxy, while
team-specific logic lived in adjacent containers running on the same
host. Those containers were baked into the AMI by the Packer + Salt
pipeline, and they could also receive their own dynamic configuration —
so the whole edge became programmable end-to-end.

The general shape: a customer request comes in, gets authenticated,
authorized, rate-limited, logged, and DoS-filtered — all before it ever
reaches the backend service. The backend just gets to serve product
logic.

## 7. Compliance Work

After all of that came the compliance push — making everything compliant
for various regulatory regimes. To be honest, this was tedious and
unenjoyable for me. It didn't involve building new things; it was about
taking what existed and walking it through long checklists. Necessary
work, just not work I personally found engaging.

## 8. Non-Technical: Diplomacy and Conflict

When I say I grew in *diplomacy*, what I really mean is: I was exposed to
a lot of different management styles and personality types over eight
years. Some of those people I had real conflicts with — and yet, still
respect.

Conflict happens when personalities don't mesh. I think the only useful
move is to develop enough self-awareness — and enough awareness of the
other person — that you can be responsible for the gap. Anticipate the
friction. Adjust where you can. Sometimes it works, sometimes it doesn't.

These conflicts were a real source of stress, and at times genuinely
affected my performance. *Because* they affected my performance, I took
them seriously and changed in response. The next time something similar
comes up, I'm confident I'll handle it better.

## 9. Non-Technical: Maintenance Over Time

The things I built had to be maintained — by me, and by people who came
after me.

At the very start of any project there's an obvious burden: write
documentation, train people, build runbooks. People going on call need to
know what specific log messages mean, what metrics to watch, what an
elevated graph could indicate, and what to do about it. What happens when
AWS has an outage and DynamoDB is unreachable? What happens if SQS stops
working and provisioning halts? What if Envoy receives valid
configuration that still mangles traffic in production? Those scenarios
need playbooks.

That work is real, but it's tractable. The *harder* problem is what
happens over years.

People come and go. New hires bring new opinions, want to refactor old
code, want to make it better. That's healthy — but it produces **churn**.
And once you've watched a codebase for long enough, you can predict
*where* the churn will concentrate. That predictability is a code smell
of its own — those areas are going to keep growing in size and
complexity, and you need to do something about them before they become
unmanageable.

That's just how software ages. Building something is the easy part.
Keeping it changeable as it grows is the hard part — because every
change tends to couple things, until eventually you change one thing and
something far away breaks, and now you have to untangle it before you
can move on.

I'm genuinely curious how this plays out in the AI-assisted era. With a
lot of code being written by people who didn't fully internalise what
they shipped, the maintenance bill is going to come due — it just hasn't
had time to accumulate yet. Maybe LLMs will be great at the untangling
work; I'd love that. But I'm not going to bet on it just yet.

## 10. Non-Technical: Mentoring vs. Teaching

I'm good at teaching. I can take a complex system, point out where
someone's mental model has a gap, fill it in, and help them get unstuck.
The feedback I consistently got from colleagues was that I was always
available and could boil down hard topics into something understandable.
I'm proud of that.

Mentoring, in my experience, is a different thing.

In my last year I had an intern. They received the highest possible
rating, which essentially guarantees a full-time offer. Their project was
impressive, and their approach to it was impressive — and that's why
they got that rating.

What I personally found difficult was the balance: how much time to
give, and what to spend that time *doing*. I didn't want to hand out
answers — but I also didn't want them to get stuck to the point of
frustration. I genuinely don't know whether I hit that balance. The
result was good, but I can't fully attribute it to me — they did the
real legwork, and several of my colleagues with deeper expertise in
specific areas contributed too. The intern essentially had access to
subject-matter experts on demand, and they used that access well.

I've never been mentored myself, so I don't have a reference for what
"good mentoring" feels like from the inside. I think that's part of why
the role felt unnatural to me. Teaching individual concepts, working
through specific problems on calls — that was my bread and butter for
the second half of my time at Atlassian. Long-arc mentorship of one
person's development is a different muscle, and one I haven't really
trained.

## 11. Closing Thoughts

That covers most of it. If I remember more, I'll probably do a follow-up.
If there's interest, I could go through and actually rebuild some of
these things from scratch — on stream or in a recorded video — both to
show what I made and to sharpen the skills again. I've got a long
to-do list, so no promises, but it depends on the demand.

If you read or watched all the way through, or even just skipped to the
chapters that were relevant to you — thank you. I hope some of it was
useful.
