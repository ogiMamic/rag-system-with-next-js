export const t = {
  appName: 'Porodično Stablo',
  tagline: 'Interaktivno 3D porodično stablo',

  nav: {
    dashboard: 'Moja stabla',
    logout: 'Odjava',
    newTree: 'Novo stablo',
    addPerson: 'Dodaj osobu',
    search: 'Pretraži...',
  },

  auth: {
    loginTitle: 'Prijava',
    signupTitle: 'Registracija',
    email: 'Email',
    password: 'Lozinka',
    login: 'Prijavi se',
    signup: 'Registruj se',
    orContinueWith: 'ili nastavi sa',
    google: 'Google',
    haveAccount: 'Već imaš nalog?',
    noAccount: 'Nemaš nalog?',
    loginHere: 'Prijavi se',
    signupHere: 'Registruj se',
    checkEmail: 'Provjeri email za potvrdu registracije.',
    loginSuccess: 'Uspješna prijava!',
    loginError: 'Greška pri prijavi',
    signupError: 'Greška pri registraciji',
  },

  dashboard: {
    title: 'Moja porodična stabla',
    empty: 'Nemaš još nijedno stablo. Napravi prvo!',
    createTree: 'Novo stablo',
    treeName: 'Naziv stabla',
    treeNamePlaceholder: 'npr. Moja porodica',
    create: 'Kreiraj',
    cancel: 'Otkaži',
    open: 'Otvori',
    persons: 'osoba',
  },

  person: {
    firstName: 'Ime',
    lastName: 'Prezime',
    maidenName: 'Djevojačko prezime',
    birthDate: 'Datum rođenja',
    deathDate: 'Datum smrti',
    gender: 'Pol',
    genderM: 'Muški',
    genderF: 'Ženski',
    genderO: 'Drugo',
    bio: 'Biografija',
    photo: 'Fotografija',
    born: 'Rođen/a',
    died: 'Umro/la',
    age: 'Starost',
    years: 'godina',
    save: 'Sačuvaj',
    delete: 'Obriši',
    edit: 'Izmijeni',
    add: 'Dodaj',
    addTitle: 'Dodaj novu osobu',
    editTitle: 'Izmijeni osobu',
    firstNameRequired: 'Ime je obavezno',
    confirmDelete: 'Da li si siguran/a da želiš obrisati ovu osobu?',
    saveError: 'Greška pri spašavanju',
    saveSuccess: 'Sačuvano',
  },

  tree: {
    loading: 'Učitavanje stabla...',
    empty: 'Stablo je prazno. Klikni "Dodaj osobu" da počneš.',
    autoRotate: 'Auto rotacija',
    resetView: 'Resetuj pogled',
  },

  common: {
    close: 'Zatvori',
    loading: 'Učitavanje...',
    error: 'Greška',
  },
} as const

export type TranslationKey = typeof t

export function formatBirthDeath(birth?: string | null, death?: string | null): string {
  const parts: string[] = []
  if (birth) parts.push(formatDate(birth))
  if (death) parts.push(`† ${formatDate(death)}`)
  return parts.join(' — ')
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
