// Country safety ratings and information
export interface CountrySafety {
  overallSafety: number; // 1-5, 5 being safest
  categories: {
    crime: number;
    health: number;
    transport: number;
    natural: number; // Natural disasters
    political: number;
    terrorism: number;
  };
  description: string;
  commonRisks: string[];
  safestAreas: string[];
  areasToAvoid: string[];
  bestTimeToVisit: string;
}

export const countrySafetyRatings: Record<string, CountrySafety> = {
  // Very Safe Countries (4.5-5.0)
  "Singapore": {
    overallSafety: 5.0,
    categories: {
      crime: 5.0,
      health: 5.0,
      transport: 5.0,
      natural: 4.5,
      political: 5.0,
      terrorism: 4.8
    },
    description: "One of the world's safest countries with strict laws and excellent infrastructure",
    commonRisks: ["Strict fines for minor offenses", "High cost of living"],
    safestAreas: ["All areas generally safe", "Well-lit public spaces 24/7"],
    areasToAvoid: ["Geylang at late night (red-light district)"],
    bestTimeToVisit: "February to April (Chinese New Year and cooler weather)"
  },
  "Japan": {
    overallSafety: 4.8,
    categories: {
      crime: 5.0,
      health: 5.0,
      transport: 5.0,
      natural: 3.0, // Earthquakes, tsunamis
      political: 5.0,
      terrorism: 5.0
    },
    description: "Extremely safe with low crime rates, but natural disaster risks exist",
    commonRisks: ["Earthquakes", "Typhoons (June-October)", "Language barrier"],
    safestAreas: ["All major cities", "Rural areas", "Tourist districts"],
    areasToAvoid: ["Kabukicho late at night", "Areas near Fukushima"],
    bestTimeToVisit: "March-May (Spring) or October-November (Fall)"
  },
  "Switzerland": {
    overallSafety: 4.8,
    categories: {
      crime: 5.0,
      health: 5.0,
      transport: 5.0,
      natural: 4.0,
      political: 5.0,
      terrorism: 4.5
    },
    description: "Very safe country with excellent healthcare and low crime",
    commonRisks: ["Mountain accidents", "Avalanches in winter", "High costs"],
    safestAreas: ["All cities and towns", "Mountain resorts"],
    areasToAvoid: ["Unmarked mountain trails", "Avalanche zones"],
    bestTimeToVisit: "April-October for hiking, December-March for skiing"
  },
  "Iceland": {
    overallSafety: 4.8,
    categories: {
      crime: 5.0,
      health: 5.0,
      transport: 4.5,
      natural: 3.5, // Volcanic activity, weather
      political: 5.0,
      terrorism: 5.0
    },
    description: "One of the world's safest countries with virtually no crime",
    commonRisks: ["Extreme weather", "Volcanic activity", "Remote area isolation"],
    safestAreas: ["Reykjavik", "All populated areas"],
    areasToAvoid: ["Unmarked trails", "Glaciers without guides"],
    bestTimeToVisit: "June-August (summer) or September-March (Northern Lights)"
  },
  "New Zealand": {
    overallSafety: 4.7,
    categories: {
      crime: 4.5,
      health: 5.0,
      transport: 4.5,
      natural: 3.5, // Earthquakes
      political: 5.0,
      terrorism: 4.8
    },
    description: "Very safe with friendly locals and good infrastructure",
    commonRisks: ["Earthquakes", "Sandflies", "Sun exposure", "Remote area risks"],
    safestAreas: ["All major cities", "Tourist towns"],
    areasToAvoid: ["South Auckland at night", "Remote trails alone"],
    bestTimeToVisit: "December-February (summer) or September-November (spring)"
  },

  // Safe Countries (4.0-4.5)
  "Canada": {
    overallSafety: 4.5,
    categories: {
      crime: 4.5,
      health: 5.0,
      transport: 4.5,
      natural: 4.0,
      political: 5.0,
      terrorism: 4.5
    },
    description: "Very safe with good healthcare and friendly people",
    commonRisks: ["Extreme cold in winter", "Wildlife in parks", "Petty theft in cities"],
    safestAreas: ["Most cities and towns", "National parks with precautions"],
    areasToAvoid: ["Vancouver's Downtown Eastside", "Remote areas unprepared"],
    bestTimeToVisit: "May-October (summer/fall) or December-March (winter sports)"
  },
  "Australia": {
    overallSafety: 4.5,
    categories: {
      crime: 4.5,
      health: 5.0,
      transport: 4.5,
      natural: 3.0, // Wildlife, bushfires
      political: 5.0,
      terrorism: 4.5
    },
    description: "Safe country but be aware of natural hazards and wildlife",
    commonRisks: ["Dangerous wildlife", "Strong sun/UV", "Bushfires", "Rip currents"],
    safestAreas: ["All major cities", "Coastal towns"],
    areasToAvoid: ["Remote outback alone", "Unpatrolled beaches"],
    bestTimeToVisit: "September-November or March-May"
  },
  "Germany": {
    overallSafety: 4.4,
    categories: {
      crime: 4.5,
      health: 5.0,
      transport: 5.0,
      natural: 4.5,
      political: 4.5,
      terrorism: 3.8
    },
    description: "Safe country with excellent infrastructure and healthcare",
    commonRisks: ["Pickpocketing in tourist areas", "Bicycle theft"],
    safestAreas: ["Most cities and towns", "Bavaria region"],
    areasToAvoid: ["Some areas of Berlin at night", "Large gatherings"],
    bestTimeToVisit: "May-September (summer) or December (Christmas markets)"
  },
  "United Kingdom": {
    overallSafety: 4.3,
    categories: {
      crime: 4.0,
      health: 5.0,
      transport: 4.5,
      natural: 4.5,
      political: 4.5,
      terrorism: 3.5
    },
    description: "Generally safe with good infrastructure and healthcare",
    commonRisks: ["Pickpocketing", "Phone snatching", "Knife crime in some areas"],
    safestAreas: ["Most city centers", "Rural areas", "Scotland"],
    areasToAvoid: ["Some London estates at night", "Parts of Manchester/Birmingham"],
    bestTimeToVisit: "May-September (warmer weather)"
  },
  "South Korea": {
    overallSafety: 4.3,
    categories: {
      crime: 4.5,
      health: 5.0,
      transport: 5.0,
      natural: 4.0,
      political: 3.5, // North Korea tensions
      terrorism: 4.5
    },
    description: "Very safe with low crime but geopolitical tensions exist",
    commonRisks: ["North Korea tensions", "Typhoons", "Air pollution"],
    safestAreas: ["Seoul", "Busan", "Jeju Island"],
    areasToAvoid: ["DMZ without tour", "Itaewon late night"],
    bestTimeToVisit: "April-May or September-November"
  },

  // Moderately Safe (3.5-4.0)
  "France": {
    overallSafety: 4.0,
    categories: {
      crime: 3.5,
      health: 5.0,
      transport: 4.5,
      natural: 4.5,
      political: 4.0,
      terrorism: 3.0
    },
    description: "Generally safe but be aware of pickpocketing and scams in tourist areas",
    commonRisks: ["Pickpocketing", "Tourist scams", "Strikes/protests"],
    safestAreas: ["Rural areas", "Small towns", "Loire Valley"],
    areasToAvoid: ["Paris suburbs (banlieues)", "Marseille Northern districts"],
    bestTimeToVisit: "April-June or September-October"
  },
  "Spain": {
    overallSafety: 4.0,
    categories: {
      crime: 3.8,
      health: 5.0,
      transport: 4.5,
      natural: 4.5,
      political: 4.0,
      terrorism: 3.5
    },
    description: "Safe country but watch for pickpocketing in tourist areas",
    commonRisks: ["Pickpocketing", "Bag snatching", "Tourist scams"],
    safestAreas: ["Northern Spain", "Small towns", "Balearic Islands"],
    areasToAvoid: ["Las Ramblas Barcelona", "Some Madrid areas at night"],
    bestTimeToVisit: "April-May or September-October"
  },
  "Italy": {
    overallSafety: 3.9,
    categories: {
      crime: 3.5,
      health: 4.5,
      transport: 4.0,
      natural: 4.0, // Earthquakes, volcanoes
      political: 4.5,
      terrorism: 3.5
    },
    description: "Generally safe but petty crime common in tourist areas",
    commonRisks: ["Pickpocketing", "Bag snatching", "Tourist scams", "Earthquakes"],
    safestAreas: ["Northern Italy", "Tuscany", "Small towns"],
    areasToAvoid: ["Naples train station area", "Rome Termini at night"],
    bestTimeToVisit: "April-June or September-October"
  },
  "United States": {
    overallSafety: 3.9,
    categories: {
      crime: 3.5,
      health: 4.0, // Expensive healthcare
      transport: 4.0,
      natural: 3.5, // Various natural disasters
      political: 4.0,
      terrorism: 3.8
    },
    description: "Generally safe but varies greatly by location",
    commonRisks: ["Gun violence", "Healthcare costs", "Natural disasters vary by region"],
    safestAreas: ["New England", "Pacific Northwest", "Mountain states"],
    areasToAvoid: ["Some inner-city areas", "Border regions at night"],
    bestTimeToVisit: "Varies by region - Spring/Fall generally best"
  },
  "China": {
    overallSafety: 3.8,
    categories: {
      crime: 4.5,
      health: 3.5,
      transport: 4.0,
      natural: 3.5,
      political: 3.0,
      terrorism: 4.5
    },
    description: "Safe from crime but political restrictions and surveillance",
    commonRisks: ["Air pollution", "Food safety", "Internet restrictions", "Surveillance"],
    safestAreas: ["Major cities", "Tourist areas"],
    areasToAvoid: ["Xinjiang region", "Tibet without permits"],
    bestTimeToVisit: "April-May or September-October"
  },
  "Thailand": {
    overallSafety: 3.8,
    categories: {
      crime: 3.5,
      health: 3.5,
      transport: 3.0, // Road safety issues
      natural: 3.5,
      political: 3.5,
      terrorism: 3.8
    },
    description: "Generally safe for tourists but some areas require caution",
    commonRisks: ["Scams", "Road accidents", "Dengue fever", "Political protests"],
    safestAreas: ["Chiang Mai", "Islands like Koh Samui", "Hua Hin"],
    areasToAvoid: ["Deep South provinces", "Khaosan Road late night"],
    bestTimeToVisit: "November-February (cool and dry)"
  },

  // Moderate Caution (3.0-3.5)
  "Indonesia": {
    overallSafety: 3.5,
    categories: {
      crime: 3.5,
      health: 3.0,
      transport: 3.0,
      natural: 2.5, // Volcanoes, earthquakes, tsunamis
      political: 3.5,
      terrorism: 3.0
    },
    description: "Popular tourist areas generally safe but natural disasters common",
    commonRisks: ["Natural disasters", "Petty theft", "Scams", "Traffic accidents"],
    safestAreas: ["Bali tourist areas", "Yogyakarta", "Lombok"],
    areasToAvoid: ["Central Sulawesi", "Remote parts of Papua"],
    bestTimeToVisit: "April-October (dry season)"
  },
  "India": {
    overallSafety: 3.3,
    categories: {
      crime: 3.0,
      health: 2.5,
      transport: 3.0,
      natural: 3.5,
      political: 3.5,
      terrorism: 3.0
    },
    description: "Requires caution but millions visit safely each year",
    commonRisks: ["Scams", "Food/water illness", "Sexual harassment", "Road safety"],
    safestAreas: ["Kerala", "Himachal Pradesh", "Goa tourist areas"],
    areasToAvoid: ["Kashmir border areas", "Northeast states without permits"],
    bestTimeToVisit: "October-March (cooler weather)"
  },
  "Mexico": {
    overallSafety: 3.2,
    categories: {
      crime: 2.5,
      health: 3.5,
      transport: 3.5,
      natural: 3.0,
      political: 3.5,
      terrorism: 4.0
    },
    description: "Tourist areas generally safe but high crime in some regions",
    commonRisks: ["Drug cartel violence", "Petty theft", "Police corruption", "Hurricanes"],
    safestAreas: ["Yucatan Peninsula", "Oaxaca", "Guanajuato"],
    areasToAvoid: ["Border cities", "Guerrero state", "Parts of Michoacán"],
    bestTimeToVisit: "December-April (dry season)"
  },
  "Turkey": {
    overallSafety: 3.2,
    categories: {
      crime: 3.5,
      health: 4.0,
      transport: 3.5,
      natural: 3.0, // Earthquakes
      political: 2.5,
      terrorism: 2.5
    },
    description: "Tourist areas generally safe but political tensions exist",
    commonRisks: ["Earthquakes", "Political tensions", "Scams", "Syrian border issues"],
    safestAreas: ["Istanbul tourist areas", "Cappadocia", "Aegean coast"],
    areasToAvoid: ["Syrian border", "Southeast provinces"],
    bestTimeToVisit: "April-May or September-November"
  },
  "Brazil": {
    overallSafety: 3.0,
    categories: {
      crime: 2.5,
      health: 3.5,
      transport: 3.0,
      natural: 3.5,
      political: 3.0,
      terrorism: 4.5
    },
    description: "Beautiful but requires constant vigilance especially in cities",
    commonRisks: ["Street crime", "Express kidnapping", "Favela violence"],
    safestAreas: ["Southern Brazil", "Florianópolis", "Tourist resorts"],
    areasToAvoid: ["Favelas", "Empty beaches at night", "ATMs at night"],
    bestTimeToVisit: "May-September (less rain, cooler)"
  },
  "Egypt": {
    overallSafety: 3.0,
    categories: {
      crime: 3.0,
      health: 3.0,
      transport: 2.5,
      natural: 4.0,
      political: 2.5,
      terrorism: 2.5
    },
    description: "Tourist areas heavily protected but some regions unstable",
    commonRisks: ["Terrorism risk", "Scams", "Sexual harassment", "Road safety"],
    safestAreas: ["Red Sea resorts", "Luxor", "Aswan"],
    areasToAvoid: ["North Sinai", "Western Desert", "Libya border"],
    bestTimeToVisit: "October-April (cooler weather)"
  },

  // Exercise Caution (2.5-3.0)
  "Philippines": {
    overallSafety: 2.8,
    categories: {
      crime: 2.5,
      health: 3.0,
      transport: 2.5,
      natural: 2.0, // Typhoons, volcanoes, earthquakes
      political: 2.5,
      terrorism: 2.5
    },
    description: "Many safe areas but some regions have serious security issues",
    commonRisks: ["Natural disasters", "Terrorism in south", "Petty crime"],
    safestAreas: ["Palawan", "Boracay", "Bohol", "Siargao"],
    areasToAvoid: ["Mindanao (except Davao)", "Sulu Archipelago"],
    bestTimeToVisit: "December-May (dry season)"
  },
  "South Africa": {
    overallSafety: 2.8,
    categories: {
      crime: 2.0,
      health: 3.0,
      transport: 3.0,
      natural: 3.5,
      political: 3.0,
      terrorism: 4.0
    },
    description: "High crime rates but tourism infrastructure good in safe areas",
    commonRisks: ["Violent crime", "Carjacking", "ATM fraud", "Home invasions"],
    safestAreas: ["Cape Town city bowl", "Garden Route", "Kruger lodges"],
    areasToAvoid: ["Townships alone", "Johannesburg CBD", "Remote ATMs"],
    bestTimeToVisit: "May-September (dry season)"
  },

  // High Caution/Reconsider Travel (Below 2.5)
  "Pakistan": {
    overallSafety: 2.3,
    categories: {
      crime: 2.5,
      health: 2.5,
      transport: 2.5,
      natural: 3.0,
      political: 2.0,
      terrorism: 1.5
    },
    description: "Security concerns but some areas safe with precautions",
    commonRisks: ["Terrorism", "Sectarian violence", "Kidnapping", "Political instability"],
    safestAreas: ["Islamabad", "Lahore tourist areas", "Hunza Valley"],
    areasToAvoid: ["Afghan border", "Balochistan", "KPK province"],
    bestTimeToVisit: "October-March (cooler weather)"
  },
  "Nigeria": {
    overallSafety: 2.2,
    categories: {
      crime: 2.0,
      health: 2.0,
      transport: 2.0,
      natural: 3.0,
      political: 2.0,
      terrorism: 2.0
    },
    description: "Significant security challenges throughout the country",
    commonRisks: ["Kidnapping", "Armed robbery", "Terrorism", "Civil unrest"],
    safestAreas: ["Abuja diplomatic area", "Lagos Victoria Island"],
    areasToAvoid: ["North-east states", "Niger Delta", "Remote areas"],
    bestTimeToVisit: "November-February (dry season)"
  },

  // Additional European Countries
  "Netherlands": {
    overallSafety: 4.5,
    categories: {
      crime: 4.0,
      health: 5.0,
      transport: 5.0,
      natural: 4.5,
      political: 5.0,
      terrorism: 4.0
    },
    description: "Very safe with excellent infrastructure",
    commonRisks: ["Bicycle accidents", "Pickpocketing in Amsterdam", "Cannabis tourist traps"],
    safestAreas: ["All cities generally safe", "Rural areas"],
    areasToAvoid: ["Red Light District late night", "Bijlmer area Amsterdam"],
    bestTimeToVisit: "April-May (tulips) or September"
  },
  "Portugal": {
    overallSafety: 4.4,
    categories: {
      crime: 4.5,
      health: 4.5,
      transport: 4.0,
      natural: 4.0,
      political: 5.0,
      terrorism: 4.5
    },
    description: "Very safe and welcoming country",
    commonRisks: ["Pickpocketing in Lisbon", "Car break-ins", "Cliff edges at beaches"],
    safestAreas: ["Most areas very safe", "Porto", "Algarve"],
    areasToAvoid: ["Martim Moniz area Lisbon at night"],
    bestTimeToVisit: "March-May or September-November"
  },

  // Additional Asian Countries
  "Vietnam": {
    overallSafety: 3.7,
    categories: {
      crime: 3.5,
      health: 3.0,
      transport: 2.5,
      natural: 3.5,
      political: 3.5,
      terrorism: 4.5
    },
    description: "Generally safe but traffic and scams common",
    commonRisks: ["Traffic accidents", "Bag snatching", "Overcharging", "Dengue"],
    safestAreas: ["Hoi An", "Da Lat", "Phu Quoc"],
    areasToAvoid: ["Saigon District 4", "Remote border areas"],
    bestTimeToVisit: "February-April or October-December"
  },
  "Malaysia": {
    overallSafety: 3.8,
    categories: {
      crime: 3.5,
      health: 4.0,
      transport: 3.5,
      natural: 3.5,
      political: 4.0,
      terrorism: 3.5
    },
    description: "Safe for tourists with normal precautions",
    commonRisks: ["Bag snatching", "Credit card fraud", "Dengue fever"],
    safestAreas: ["Kuala Lumpur city center", "Penang", "Langkawi"],
    areasToAvoid: ["Eastern Sabah", "Thai border areas"],
    bestTimeToVisit: "December-February or June-August"
  },

  // Middle East & North Africa
  "UAE": {
    overallSafety: 4.6,
    categories: {
      crime: 5.0,
      health: 4.5,
      transport: 4.0,
      natural: 4.5,
      political: 4.5,
      terrorism: 4.5
    },
    description: "Very safe with strict laws and modern infrastructure",
    commonRisks: ["Strict laws on behavior", "Extreme heat", "Driving standards"],
    safestAreas: ["All emirates generally very safe"],
    areasToAvoid: ["Industrial areas", "Yemen border region"],
    bestTimeToVisit: "November-March (cooler weather)"
  },
  "Morocco": {
    overallSafety: 3.4,
    categories: {
      crime: 3.0,
      health: 3.5,
      transport: 3.0,
      natural: 4.0,
      political: 3.5,
      terrorism: 3.0
    },
    description: "Generally safe but persistent hassling in tourist areas",
    commonRisks: ["Aggressive vendors", "Pickpocketing", "Fake guides", "Food poisoning"],
    safestAreas: ["Marrakech new town", "Essaouira", "Chefchaouen"],
    areasToAvoid: ["Western Sahara", "Algeria border", "Rif Mountains alone"],
    bestTimeToVisit: "March-May or September-November"
  }
};