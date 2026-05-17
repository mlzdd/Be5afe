// Common scams and safety warnings by country/region
export const countryScams: Record<string, Array<{
  title: string;
  description: string;
  prevention: string;
  severity: "high" | "medium" | "low";
}>> = {
  // Southeast Asia
  "Thailand": [
    {
      title: "Tuk-Tuk Overcharging",
      description: "Drivers refuse to use meter, quote inflated prices to tourists",
      prevention: "Use Grab app or agree on price before getting in. Insist on meter for regular taxis",
      severity: "medium"
    },
    {
      title: "Gem Store Scam",
      description: "Friendly locals direct you to 'special sale' gem stores selling worthless stones",
      prevention: "Never buy gems unless you're an expert. Ignore unsolicited shopping advice",
      severity: "high"
    },
    {
      title: "Grand Palace Closed Scam",
      description: "Scammers tell you attractions are closed and offer alternative tours",
      prevention: "Check official websites. Grand Palace is rarely closed",
      severity: "medium"
    },
    {
      title: "Jet Ski Damage Scam",
      description: "Operators claim you damaged their jet ski and demand payment",
      prevention: "Take photos/video before renting. Use reputable operators only",
      severity: "high"
    }
  ],
  "Indonesia": [
    {
      title: "Money Changer Scam",
      description: "Sleight of hand tricks to shortchange you during currency exchange",
      prevention: "Use authorized money changers. Count money carefully before leaving",
      severity: "high"
    },
    {
      title: "Taxi Meter Tampering",
      description: "Rigged meters that run faster than normal",
      prevention: "Use Grab or Gojek. For regular taxis, use Bluebird only",
      severity: "medium"
    },
    {
      title: "ATM Skimming",
      description: "Card readers installed on ATMs to steal card information",
      prevention: "Use ATMs inside banks. Cover PIN entry. Check for suspicious attachments",
      severity: "high"
    }
  ],
  "Vietnam": [
    {
      title: "Cyclo Overcharging",
      description: "Drivers demand 10x the agreed price at destination",
      prevention: "Write down agreed price. Use Grab instead for transparency",
      severity: "medium"
    },
    {
      title: "Shoe Cleaning Scam",
      description: "Your shoes get 'accidentally' dirty, then someone offers to clean them for a fee",
      prevention: "Decline all unsolicited services. Keep walking",
      severity: "low"
    },
    {
      title: "Wrong Change Scam",
      description: "Confusion with similar looking Vietnamese Dong notes",
      prevention: "Learn the currency. Count change carefully. Use cards when possible",
      severity: "medium"
    }
  ],
  "India": [
    {
      title: "Fake Travel Agents",
      description: "Overcharge for tickets or provide fake bookings",
      prevention: "Book directly with airlines/railways or use official apps",
      severity: "high"
    },
    {
      title: "Taxi/Rickshaw Detours",
      description: "Drivers take you to commission-based shops instead of destination",
      prevention: "Use Uber/Ola. Be firm about your destination",
      severity: "medium"
    },
    {
      title: "Blessing Scam",
      description: "String tied on wrist followed by aggressive demand for money",
      prevention: "Firmly decline all unsolicited physical contact",
      severity: "low"
    }
  ],
  // Europe
  "France": [
    {
      title: "Gold Ring Scam",
      description: "Someone 'finds' a gold ring near you and tries to sell it",
      prevention: "Walk away immediately. The ring is worthless brass",
      severity: "low"
    },
    {
      title: "Petition Scam",
      description: "Groups asking for signatures while accomplices pickpocket",
      prevention: "Never sign street petitions. Keep walking",
      severity: "high"
    },
    {
      title: "Rose/Bracelet Scam",
      description: "Friendly person gives you a 'free' item then demands payment",
      prevention: "Never accept anything from strangers on the street",
      severity: "medium"
    },
    {
      title: "ATM Helper Scam",
      description: "Someone offers to help at ATM to see your PIN",
      prevention: "Never accept help at ATMs. Cancel transaction if approached",
      severity: "high"
    }
  ],
  "Italy": [
    {
      title: "Gladiator Photo Scam",
      description: "Costumed gladiators charge excessive fees after photos",
      prevention: "Ask price before any photos. Better to avoid entirely",
      severity: "medium"
    },
    {
      title: "Restaurant Bill Padding",
      description: "Extra charges added like 'coperto' or items you didn't order",
      prevention: "Check menu for all charges. Review bill carefully",
      severity: "medium"
    },
    {
      title: "Fake Police Scam",
      description: "Fake officers ask to check your wallet for counterfeit bills",
      prevention: "Real police have proper ID. Ask to go to police station",
      severity: "high"
    }
  ],
  "Spain": [
    {
      title: "Bird Poop Scam",
      description: "Someone spills on you, accomplice offers help while stealing",
      prevention: "Decline help, secure belongings, clean up yourself",
      severity: "high"
    },
    {
      title: "Fake Football Tickets",
      description: "Scalpers selling counterfeit match tickets",
      prevention: "Buy only from official sources",
      severity: "medium"
    },
    {
      title: "Pickpocketing",
      description: "Especially common on Las Ramblas and metro",
      prevention: "Use money belts. Keep bags in front. Be extra vigilant in crowds",
      severity: "high"
    }
  ],
  "Austria": [
    {
      title: "Digital Vignette Scam",
      description: "Fake websites impersonating ASFINAG selling highway vignettes at inflated prices or stealing payment info. Average loss €500-3000 per victim",
      prevention: "Only buy vignettes from official ASFINAG website (asfinag.at). Never use search engines to find vignette sites. Verify URL carefully",
      severity: "high"
    },
    {
      title: "Fake Attraction Tickets",
      description: "Counterfeit websites selling invalid tickets for Schönbrunn Palace, Vienna Opera, and other attractions. Daily victims: 20-30",
      prevention: "Purchase tickets only from official venue websites. Avoid third-party resellers. Check for HTTPS and official domain",
      severity: "medium"
    },
    {
      title: "FinanzOnline Phishing",
      description: "SMS or emails claiming your tax account needs updating, leading to fake banking sites. Average loss €10,000+ per victim",
      prevention: "Never click links in tax-related messages. Access FinanzOnline only through official website. Austrian tax office never requests info via SMS",
      severity: "high"
    },
    {
      title: "Bracelet Scam at Train Stations",
      description: "Groups forcefully tie bracelets on tourists at Vienna train stations then demand €10-20. Common at Wien Hauptbahnhof and Westbahnhof",
      prevention: "Keep hands in pockets near train stations. Firmly refuse any approach. Walk away immediately if approached",
      severity: "medium"
    },
    {
      title: "Fake Charity Collectors",
      description: "People in vests claiming to collect for refugees or disabled, especially in tourist areas. Some use distraction for pickpocketing",
      prevention: "Real Austrian charities don't solicit on streets. Never give cash to street collectors. Donate through official channels only",
      severity: "medium"
    }
  ],
  "Turkey": [
    {
      title: "Shoe Shine Scam",
      description: "Drops brush, you help, then demands payment for 'free' shine",
      prevention: "Don't pick up dropped items. Keep walking",
      severity: "low"
    },
    {
      title: "Bar/Club Scam",
      description: "Friendly locals invite you for drinks, huge bill arrives",
      prevention: "Never follow strangers to bars. Choose venues yourself",
      severity: "high"
    },
    {
      title: "Carpet Selling Pressure",
      description: "High-pressure sales tactics in carpet shops",
      prevention: "Be firm. Don't feel obligated to buy after tea",
      severity: "medium"
    }
  ],
  // Americas
  "Mexico": [
    {
      title: "Police Bribes",
      description: "Corrupt officers demanding bribes for fake violations",
      prevention: "Ask for ticket and pay at station. Know your rights",
      severity: "high"
    },
    {
      title: "Timeshare Scam",
      description: "High-pressure sales for overpriced timeshares",
      prevention: "Avoid timeshare presentations. Don't sign anything",
      severity: "medium"
    },
    {
      title: "ATM Cloning",
      description: "Card skimmers on ATMs, especially in tourist areas",
      prevention: "Use ATMs in banks. Check for tampering",
      severity: "high"
    }
  ],
  "Brazil": [
    {
      title: "Quick Change Scam",
      description: "Confusion during money exchange at shops",
      prevention: "Count change carefully. Know the currency",
      severity: "medium"
    },
    {
      title: "Fake Charity",
      description: "Children or adults asking for donations",
      prevention: "Donate only to registered charities",
      severity: "low"
    },
    {
      title: "Express Kidnapping",
      description: "Forced to withdraw money from ATMs",
      prevention: "Use safe ATMs. Avoid displaying wealth. Use Uber",
      severity: "high"
    }
  ],
  "United States": [
    {
      title: "Rental Car Damage",
      description: "Excessive charges for minor damage",
      prevention: "Document car condition thoroughly. Consider insurance",
      severity: "medium"
    },
    {
      title: "Times Square Characters",
      description: "Costumed characters demanding tips after photos",
      prevention: "Avoid or agree on price first",
      severity: "low"
    },
    {
      title: "Tourist Pricing",
      description: "Inflated prices in tourist areas",
      prevention: "Research normal prices. Shop where locals shop",
      severity: "medium"
    }
  ],
  // Middle East
  "UAE": [
    {
      title: "Gold Souk Scams",
      description: "Fake gold or inflated prices in markets",
      prevention: "Buy from reputable stores. Get certificates",
      severity: "medium"
    },
    {
      title: "Massage Card Scam",
      description: "Cards advertising illegal services, police setup",
      prevention: "Ignore and dispose of any such cards immediately",
      severity: "high"
    }
  ],
  "Egypt": [
    {
      title: "Papyrus Scam",
      description: "Fake papyrus sold as authentic ancient art",
      prevention: "Buy from museum shops only",
      severity: "medium"
    },
    {
      title: "Camel Ride Scam",
      description: "Free ride up, payment demanded to get down",
      prevention: "Agree on full price before mounting",
      severity: "medium"
    },
    {
      title: "Baksheesh Pressure",
      description: "Excessive tipping demands for basic services",
      prevention: "Tip appropriately, not excessively. Be firm",
      severity: "low"
    }
  ],
  // Africa
  "Morocco": [
    {
      title: "Fake Guide Scam",
      description: "Unofficial guides leading you astray then demanding payment",
      prevention: "Use only official guides with badges",
      severity: "medium"
    },
    {
      title: "Closed Road Scam",
      description: "Locals say road is closed, offer expensive detour",
      prevention: "Check with police or hotel. Roads rarely close",
      severity: "medium"
    },
    {
      title: "Hash Scam",
      description: "Offered drugs then threatened with police",
      prevention: "Never accept anything illegal. Walk away immediately",
      severity: "high"
    }
  ],
  "Kenya": [
    {
      title: "Safari Overcharging",
      description: "Fake tour operators or inflated last-minute fees",
      prevention: "Book with established companies. Get everything in writing",
      severity: "high"
    },
    {
      title: "Charity Scam",
      description: "Fake orphanage visits or donation requests",
      prevention: "Research charities. Donate through official channels",
      severity: "medium"
    }
  ],
  "South Africa": [
    {
      title: "Car Guard Extortion",
      description: "Aggressive demands for parking 'protection' money",
      prevention: "Pay reasonable amount or park in secure lots",
      severity: "low"
    },
    {
      title: "Credit Card Fraud",
      description: "Card cloning at restaurants and shops",
      prevention: "Never let card out of sight. Use tap when possible",
      severity: "high"
    }
  ],
  // Oceania
  "Australia": [
    {
      title: "Fake Farm Work",
      description: "Scams targeting working holiday visa holders",
      prevention: "Verify employers through official channels",
      severity: "medium"
    },
    {
      title: "Rental Scam",
      description: "Fake property listings requiring deposits",
      prevention: "Never pay without viewing. Use legitimate sites",
      severity: "high"
    }
  ]
};