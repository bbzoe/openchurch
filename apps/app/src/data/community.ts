export type Denomination = {
  slug: string;
  name: string;
  tradition: string;
  countries?: string[];
};

export const otherDenomination = "other";

const traditions = [
  "Catholic",
  "Orthodox",
  "Lutheran",
  "Reformed",
  "Anglican",
  "Methodist",
  "Baptist",
  "Anabaptist",
  "Pentecostal",
  "Charismatic",
  "Evangelical",
  "Holiness",
  "Adventist",
  "Independent",
] as const;

export const traditionOrder: string[] = [...traditions];

export const denominations: Denomination[] = [
  { slug: "roman-catholic", name: "Roman Catholic Church", tradition: "Catholic" },
  { slug: "pl-catholic", name: "Kościół rzymskokatolicki", tradition: "Catholic", countries: ["PL"] },
  { slug: "greek-catholic", name: "Greek Catholic Churches", tradition: "Catholic" },
  { slug: "pl-greek-catholic", name: "Kościół greckokatolicki", tradition: "Catholic", countries: ["PL"] },
  { slug: "polish-catholic", name: "Kościół Polskokatolicki", tradition: "Catholic", countries: ["PL"] },
  { slug: "mariavite", name: "Kościół Starokatolicki Mariawitów", tradition: "Catholic", countries: ["PL"] },
  { slug: "old-catholic", name: "Old Catholic churches", tradition: "Catholic" },

  { slug: "eastern-orthodox", name: "Eastern Orthodox Church", tradition: "Orthodox" },
  { slug: "pl-orthodox", name: "Polski Autokefaliczny Kościół Prawosławny", tradition: "Orthodox", countries: ["PL"] },
  { slug: "oriental-orthodox", name: "Oriental Orthodox churches", tradition: "Orthodox" },

  { slug: "lutheran", name: "Lutheran churches", tradition: "Lutheran" },
  { slug: "pl-lutheran", name: "Kościół Ewangelicko-Augsburski", tradition: "Lutheran", countries: ["PL"] },

  { slug: "reformed", name: "Reformed churches", tradition: "Reformed" },
  { slug: "presbyterian", name: "Presbyterian churches", tradition: "Reformed" },
  { slug: "pl-reformed", name: "Kościół Ewangelicko-Reformowany", tradition: "Reformed", countries: ["PL"] },
  { slug: "ucc", name: "United Church of Christ", tradition: "Reformed" },

  { slug: "anglican", name: "Anglican Communion", tradition: "Anglican" },
  { slug: "episcopal", name: "The Episcopal Church", tradition: "Anglican", countries: ["US"] },
  { slug: "church-of-england", name: "Church of England", tradition: "Anglican", countries: ["GB"] },

  { slug: "methodist", name: "Methodist churches", tradition: "Methodist" },
  { slug: "united-methodist", name: "United Methodist Church", tradition: "Methodist", countries: ["US"] },
  { slug: "pl-methodist", name: "Kościół Ewangelicko-Metodystyczny", tradition: "Methodist", countries: ["PL"] },

  { slug: "baptist", name: "Baptist churches", tradition: "Baptist" },
  { slug: "southern-baptist", name: "Southern Baptist Convention", tradition: "Baptist", countries: ["US"] },
  { slug: "pl-baptist", name: "Kościół Chrześcijan Baptystów", tradition: "Baptist", countries: ["PL"] },

  { slug: "mennonite", name: "Mennonite churches", tradition: "Anabaptist" },
  { slug: "brethren", name: "Church of the Brethren", tradition: "Anabaptist" },
  { slug: "pl-free-christians", name: "Kościół Wolnych Chrześcijan", tradition: "Anabaptist", countries: ["PL"] },

  { slug: "assemblies-of-god", name: "Assemblies of God", tradition: "Pentecostal" },
  { slug: "church-of-god", name: "Church of God (Cleveland)", tradition: "Pentecostal" },
  { slug: "foursquare", name: "Foursquare Church", tradition: "Pentecostal" },
  { slug: "pl-pentecostal", name: "Kościół Zielonoświątkowy w RP", tradition: "Pentecostal", countries: ["PL"] },
  { slug: "pl-god-in-christ", name: "Kościół Boży w Chrystusie", tradition: "Pentecostal", countries: ["PL"] },
  { slug: "pl-church-of-god", name: "Kościół Boży w Polsce", tradition: "Pentecostal", countries: ["PL"] },
  { slug: "pl-christ-church", name: "Kościół Chrystusowy w RP", tradition: "Pentecostal", countries: ["PL"] },

  { slug: "vineyard", name: "Vineyard churches", tradition: "Charismatic" },
  { slug: "charismatic-renewal", name: "Charismatic renewal", tradition: "Charismatic" },

  { slug: "evangelical-free", name: "Evangelical Free churches", tradition: "Evangelical" },
  { slug: "cma", name: "Christian and Missionary Alliance", tradition: "Evangelical" },
  { slug: "pl-evangelical", name: "Kościół Ewangelicznych Chrześcijan", tradition: "Evangelical", countries: ["PL"] },
  { slug: "nondenominational", name: "Non-denominational", tradition: "Evangelical" },

  { slug: "nazarene", name: "Church of the Nazarene", tradition: "Holiness" },
  { slug: "wesleyan", name: "Wesleyan Church", tradition: "Holiness" },
  { slug: "salvation-army", name: "The Salvation Army", tradition: "Holiness" },

  { slug: "sda", name: "Seventh-day Adventist Church", tradition: "Adventist" },
  { slug: "pl-sda", name: "Kościół Adwentystów Dnia Siódmego", tradition: "Adventist", countries: ["PL"] },

  { slug: "independent", name: "Independent congregation", tradition: "Independent" },
];

export function listCountries() {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const countries: { code: string; name: string }[] = [];
  for (let i = 65; i <= 90; i += 1) {
    for (let j = 65; j <= 90; j += 1) {
      const code = String.fromCharCode(i) + String.fromCharCode(j);
      const name = names.of(code);
      if (!name || name === code) continue;
      countries.push({ code, name });
    }
  }
  return countries.sort((a, b) => a.name.localeCompare(b.name));
}

export function denominationsForCountry(countryCode: string) {
  const local = denominations.filter((item) => item.countries?.includes(countryCode));
  const wider = denominations.filter((item) => !item.countries);
  return { local, wider };
}

export function denominationBySlug(slug: string) {
  return denominations.find((item) => item.slug === slug) ?? null;
}
