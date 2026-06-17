export interface LocalizedScheme {
  title: string;
  category: string;
  targetCrop: string;
  description: string;
  visitPortal: string;
}

export const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'All': 'All Schemes',
    'Direct Income Support': 'Direct Income Support',
    'Crop Insurance': 'Crop Insurance',
    'State Investment Support': 'State Investment Support',
    'Subsidies & Equipment': 'Subsidies & Equipment',
    'Soil & Fertilizer Aid': 'Soil & Fertilizer Aid'
  },
  te: {
    'All': 'అన్ని పథకాలు',
    'Direct Income Support': 'నేరుగా ఆదాయ సహాయం',
    'Crop Insurance': 'పంట భీమా',
    'State Investment Support': 'రాష్ట్ర పెట్టుబడి సహాయం',
    'Subsidies & Equipment': 'సబ్సిడీలు & పరికరాలు',
    'Soil & Fertilizer Aid': 'నేల & ఎరువుల సహాయం'
  },
  hi: {
    'All': 'सभी योजनाएं',
    'Direct Income Support': 'प्रत्यक्ष आय सहायता',
    'Crop Insurance': 'फसल बीमा',
    'State Investment Support': 'राज्य निवेश सहायता',
    'Subsidies & Equipment': 'सब्सिडी और उपकरण',
    'Soil & Fertilizer Aid': 'मिट्टी और उर्वरक सहायता'
  },
  gu: {
    'All': 'તમામ યોજનાઓ',
    'Direct Income Support': 'સીધી આવક સહાય',
    'Crop Insurance': 'પાક વીમો',
    'State Investment Support': 'રાજ્ય રોકાણ સહાય',
    'Subsidies & Equipment': 'સબસિડી અને સાધનો',
    'Soil & Fertilizer Aid': 'જમીન અને ખાતર સહાય'
  },
  mr: {
    'All': 'सर्व योजना',
    'Direct Income Support': 'थेट उत्पन्न मदत',
    'Crop Insurance': 'पीक विमा',
    'State Investment Support': 'राज्य गुंतवणूक मदत',
    'Subsidies & Equipment': 'अनुदान आणि उपकरणे',
    'Soil & Fertilizer Aid': 'जमीन आणि खत मदत'
  },
  ta: {
    'All': 'அனைத்து திட்டங்கள்',
    'Direct Income Support': 'நேரடி வருமான உதவி',
    'Crop Insurance': 'பயிர் காப்பீடு',
    'State Investment Support': 'மாநில முதலீட்டு உதவி',
    'Subsidies & Equipment': 'மானியங்கள் & உபகரணங்கள்',
    'Soil & Fertilizer Aid': 'மண் & உர உதவி'
  },
  kn: {
    'All': 'ಎಲ್ಲಾ ಯೋಜನೆಗಳು',
    'Direct Income Support': 'ನೇರ ಆದಾಯ ಬೆಂಬಲ',
    'Crop Insurance': 'ಬೆಳೆ ವಿಮೆ',
    'State Investment Support': 'ರಾಜ್ಯ ಬಂಡವಾಳ ನೆರವು',
    'Subsidies & Equipment': 'ಸಬ್ಸಿಡಿಗಳು ಮತ್ತು ಉಪಕರಣಗಳು',
    'Soil & Fertilizer Aid': 'ಮಣ್ಣು ಮತ್ತು ರಸಗೊಬ್ಬರ ನೆರವು'
  },
  bn: {
    'All': 'সব প্রকল্প',
    'Direct Income Support': 'সরাসরি আয় সহায়তা',
    'Crop Insurance': 'ফসল বিমা',
    'State Investment Support': 'রাজ্য বিনিয়োগ সহায়তা',
    'Subsidies & Equipment': 'ভর্তুকি ও সরঞ্জাম',
    'Soil & Fertilizer Aid': 'মাটি ও সার সহায়তা'
  },
  pa: {
    'All': 'ਸਾਰੀਆਂ ਸਕੀਮਾਂ',
    'Direct Income Support': 'ਸਿੱਧੀ ਆਮਦਨ ਸਹਾਇਤਾ',
    'Crop Insurance': 'ਫਸਲ ਬੀਮਾ',
    'State Investment Support': 'ਰਾਜ ਨਿਵੇਸ਼ ਸਹਾਇਤਾ',
    'Subsidies & Equipment': 'ਸਬਸਿਡੀ ਅਤੇ ਉਪਕਰਣ',
    'Soil & Fertilizer Aid': 'ਮਿੱਟੀ ਅਤੇ ਖਾਦ ਸਹਾਇਤਾ'
  },
  ml: {
    'All': 'എല്ലാ പദ്ധതികളും',
    'Direct Income Support': 'നേരിട്ടുള്ള വരുമാന സഹായം',
    'Crop Insurance': 'വിള ഇൻഷുറൻസ്',
    'State Investment Support': 'സംസ്ഥാന നിക്ഷേപ സഹായം',
    'Subsidies & Equipment': 'സബ്‌സിഡികളും ഉപകരണങ്ങളും',
    'Soil & Fertilizer Aid': 'മണ്ണ്-വള സഹായം'
  }
};

export const PAGE_TRANSLATIONS: Record<string, { title: string; desc: string; placeholder: string }> = {
  en: {
    title: 'Government Schemes & Portals',
    desc: 'Explore direct income benefits, agricultural subsidies, and crop insurance programs provided by Central & State governments.',
    placeholder: 'Search schemes or crops...'
  },
  te: {
    title: 'ప్రభుత్వ పథకాలు & పోర్టల్స్',
    desc: 'కేంద్ర మరియు రాష్ట్ర ప్రభుత్వాలు అందిస్తున్న ప్రత్యక్ష ఆదాయ ప్రయోజనాలు, వ్యవసాయ సబ్సిడీలు మరియు పంట భీమా కార్యక్రమాలను అన్వేషించండి.',
    placeholder: 'పథకాలు లేదా పంటలను శోధించండి...'
  },
  hi: {
    title: 'सरकारी योजनाएं और पोर्टल',
    desc: 'केंद्र और राज्य सरकारों द्वारा प्रदान किए जाने वाले प्रत्यक्ष आय लाभ, कृषि सब्सिडी और फसल बीमा कार्यक्रमों का पता लगाएं।',
    placeholder: 'योजनाओं या फसलों की खोज करें...'
  },
  gu: {
    title: 'સરકારી યોજનાઓ અને પોર્ટલ',
    desc: 'કેન્દ્ર અને રાજ્ય સરકારો દ્વારા પૂરી પાડવામાં આવતી સીધી આવક સહાય, સબસિડી અને પાક વીમા યોજનાઓ વિશે જાણો.',
    placeholder: 'યોજનાઓ અથવા પાક શોધો...'
  },
  mr: {
    title: 'सरकारी योजना आणि पोर्टल',
    desc: 'केंद्र आणि राज्य सरकारांनी प्रदान केलेल्या थेट उत्पन्न योजना, कृषी सबसिडी आणि पीक विमा कार्यक्रमांचा शोध घ्या.',
    placeholder: 'योजना किंवा पिके शोधा...'
  },
  ta: {
    title: 'அரசு திட்டங்கள் & இணையதளங்கள்',
    desc: 'மத்திய மற்றும் மாநில அரசுகளால் வழங்கப்படும் நேரடி வருமான நன்மைகள், விவசாய மானியங்கள் மற்றும் பயிர் காப்பீட்டு திட்டங்களை ஆராயுங்கள்.',
    placeholder: 'திட்டங்கள் அல்லது பயிர்களைத் தேடுங்கள்...'
  },
  kn: {
    title: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಪೋರ್ಟಲ್ಗಳು',
    desc: 'ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ಸರ್ಕಾರಗಳು ಒದಗಿಸುವ ನೇರ ಆದಾಯದ ನೆರವು, ಕೃಷಿ ಸಬ್ಸಿಡಿಗಳು ಮತ್ತು ಬೆಳೆ ವಿಮಾ ಯೋಜನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.',
    placeholder: 'ಯೋಜನೆಗಳು ಅಥವಾ ಬೆಳೆಗಳನ್ನು ಹುಡುಕಿ...'
  },
  bn: {
    title: 'সরকারি প্রকল্প ও পোর্টাল',
    desc: 'কেন্দ্রীয় ও রাজ্য সরকারের সরাসরি আর্থিক সহায়তা, কৃষি ভর্তুকি এবং ফসল বিমা প্রকল্পগুলি সম্পর্কে জানুন।',
    placeholder: 'প্রকল্প বা ফসল খুঁজুন...'
  },
  pa: {
    title: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਅਤੇ ਪੋਰਟਲ',
    desc: 'ਕੇਂਦਰ ਅਤੇ ਰਾਜ ਸਰਕਾਰਾਂ ਦੁਆਰਾ ਪ੍ਰਦਾਨ ਕੀਤੇ ਜਾਂਦੇ ਸਿੱਧੇ ਵਿੱਤੀ ਲਾਭ, ਖੇਤੀਬਾੜੀ ਸਬਸਿਡੀਆਂ ਅਤੇ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾਵਾਂ ਬਾਰੇ ਜਾਣੋ।',
    placeholder: 'ਸਕੀਮਾਂ ਜਾਂ ਫਸਲਾਂ ਦੀ ਖੋਜ ਕਰੋ...'
  },
  ml: {
    title: 'സർക്കാർ പദ്ധതികളും പോർട്ടലുകളും',
    desc: 'കേന്ദ്ര-സംസ്ഥാന സർക്കാരുകൾ നൽകുന്ന നേരിട്ടുള്ള വരുമാന സഹായം, കാർഷിക സബ്‌സിഡികൾ, വിള ഇൻഷുറൻസ് പദ്ധതികൾ എന്നിവയെക്കുറിച്ച് അറിയുക.',
    placeholder: 'പദ്ധതികളോ വിളകളോ തിരയുക...'
  }
};

export const SCHEMES_TRANSLATIONS: Record<string, Record<string, LocalizedScheme>> = {
  en: {
    'scheme-1': {
      title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'An initiative by the Government of India that provides up to ₹6,000 per year in three equal installments to small and marginal farmers.',
      visitPortal: 'Visit Official Portal'
    },
    'scheme-2': {
      title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'A government-sponsored crop insurance scheme that integrates multiple stakeholders to protect farmers from climate-related yield losses.',
      visitPortal: 'Visit Official Portal'
    },
    'scheme-3': {
      title: 'Rythu Bandhu Scheme',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'Telangana government investment support scheme providing ₹5,000 per acre per season directly to farmers for purchase of seeds, fertilizers, and inputs.',
      visitPortal: 'Visit Official Portal'
    }
  },
  te: {
    'scheme-1': {
      title: 'ピーエム-キサン (ప్రధాన మంత్రి కిసాన్ సమ్మాన్ నిధి)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'చిన్న మరియు ఉపాంత రైతులకు సంవత్సరానికి ₹6,000 మూడు సమాన విడతలలో అందించే భారత ప్రభుత్వ చొరవ.',
      visitPortal: 'అధికారిక వెబ్‌సైట్ చూడండి'
    },
    'scheme-2': {
      title: 'ప్రధాన మంత్రి ఫసల్ బీమా యోజన (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'వాతావరణ సంబంధిత పంట నష్టాల నుండి రైతులను రક્ષించడానికి బహుళ వాటాదారులను అనుసంధానించే ప్రభుత్వ పంట బీమా పథకం.',
      visitPortal: 'అధికారిక వెబ్‌సైట్ చూడండి'
    },
    'scheme-3': {
      title: 'రైతు బంధు పథకం',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'విత్తనాలు, ఎరువులు మరియు ఇతర పెట్టుబడుల కొనుగోలు కోసం రైతులకు నేరుగా ఎకరానికి ₹5,000 చొప్పున పెట్టుబడి సహాయం అందించే తెలంగాణ ప్రభుత్వ పథకం.',
      visitPortal: 'అధికారిక వెబ్‌సైట్ చూడండి'
    }
  },
  hi: {
    'scheme-1': {
      title: 'पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'भारत सरकार की एक पहल जो छोटे और सीमांत किसानों को तीन समान किस्तों में प्रति वर्ष ₹6,000 तक की प्रत्यक्ष आय सहायता प्रदान करती है।',
      visitPortal: 'आधिकारिक वेबसाइट देखें'
    },
    'scheme-2': {
      title: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'एक सरकार प्रायोजित फसल बीमा योजना जो मौसम संबंधी पैदावार के नुकसान से किसानों की रक्षा के लिए विभिन्न हितधारकों को जोड़ती है।',
      visitPortal: 'आधिकारिक वेबसाइट देखें'
    },
    'scheme-3': {
      title: 'रैतु बंधु योजना',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'तेलंगाना सरकार की निवेश सहायता योजना जो किसानों को बीज, उर्वरक और इनपुट की खरीद के लिए सीधे ₹5,000 प्रति एकड़ प्रति सीजन प्रदान करती है।',
      visitPortal: 'आधिकारिक वेबसाइट देखें'
    }
  },
  gu: {
    'scheme-1': {
      title: 'પીએમ-કિસાન (પ્રધાનમંત્રી કિસાન સન્માન નિધિ)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'ભારત સરકારની એક પહેલ જે નાના અને સીમાંત ખેડૂતોને ત્રણ સમાન હપ્તામાં વાર્ષિક ₹૬,૦૦૦ ની સીધી સહાય પૂરી પાડે છે.',
      visitPortal: 'આધિકારિક વેબસાઇટ જુઓ'
    },
    'scheme-2': {
      title: 'પ્રધાનમંત્રી ફસલ બીમા યોજના (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'સરકાર પ્રાયોજિત પાક વીમા યોજના જે ખેડૂતોને હવામાન સંબંધિત નુકસાન સામે રક્ષણ આપે છે.',
      visitPortal: 'આધિકારિક વેબસાઇટ જુઓ'
    },
    'scheme-3': {
      title: 'રાયતુ બંધુ યોજના',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'તેલંગાણા સરકારની યોજના જે બિયારણ, ખાતર વગેરેની ખરીદી માટે પ્રતિ મોસમ એકર દીઠ ₹૫,૦૦૦ ની સીધી સહાય આપે છે.',
      visitPortal: 'આધિકારિક વેબસાઇટ જુઓ'
    }
  },
  mr: {
    'scheme-1': {
      title: 'पीएम-किसान (प्रधानमंत्री किसान सन्मान निधी)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'भारत सरकारचा पुढाकार ज्याद्वारे अल्पभूधारक आणि सीमांत शेतकऱ्यांना दरवर्षी ₹६,००० तीन समान हप्त्यांमध्ये दिले जातात.',
      visitPortal: 'अधिकृत वेबसाइट पहा'
    },
    'scheme-2': {
      title: 'प्रधानमंत्री पीक विमा योजना (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'शेतकऱ्यांना हवामान बदलामुळे होणाऱ्या पिकांच्या नुकसानीपासून वाचवण्यासाठी सुरू केलेली पीक विमा योजना.',
      visitPortal: 'अधिकृत वेबसाइट पहा'
    },
    'scheme-3': {
      title: 'रयतू बंधू योजना',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'तेलंगणा सरकारची गुंतवणूक मदत योजना जी बियाणे आणि खतांच्या खरेदीसाठी शेतकऱ्यांना थेट प्रति एकर प्रति हंगाम ₹५,००० प्रदान करते.',
      visitPortal: 'अधिकृत वेबसाइट पहा'
    }
  },
  ta: {
    'scheme-1': {
      title: 'பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'சிறு மற்றும் குறு விவசாயிகளுக்கு ஆண்டுக்கு ₹6,000 நிதியுதவியை மூன்று சம தவணைகளாக வழங்கும் இந்திய அரசின் திட்டம்.',
      visitPortal: 'அதிகாரப்பூர்வ வலைத்தளத்தைப் பார்வையிடவும்'
    },
    'scheme-2': {
      title: 'பிரதான் மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'வானிலை மாற்றங்களால் ஏற்படும் பயிர் இழப்புகளிலிருந்து விவசாயிகளைப் பாதுகாக்கும் அரசு காப்பீட்டுத் திட்டம்.',
      visitPortal: 'அதிகாரப்பூர்வ வலைத்தளத்தைப் பார்வையிடவும்'
    },
    'scheme-3': {
      title: 'ரைத்து பந்து திட்டம்',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'விதை, உரங்கள் வாங்க விவசாயிகளுக்கு ஏக்கருக்கு ₹5,000 வீதம் நேரடி முதலீட்டு உதவி வழங்கும் தெலுங்கானா அரசு திட்டம்.',
      visitPortal: 'அதிகாரப்பூர்வ வலைத்தளத்தைப் பார்வையிடவும்'
    }
  },
  kn: {
    'scheme-1': {
      title: 'ಪಿಎಂ-ಕಿಸಾನ್ (ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರಿಗೆ ವಾರ್ಷಿಕ ₹6,000 ಅನ್ನು ಮೂರು ಸಮಾನ ಕಂತುಗಳಲ್ಲಿ ಒದಗಿಸುವ ಭಾರತ ಸರ್ಕಾರದ ಯೋಜನೆ.',
      visitPortal: 'ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಭೇಟಿ ನೀಡಿ'
    },
    'scheme-2': {
      title: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'ಹವಾമാന ವೈಪರೀತ್ಯದಿಂದ ಉಂಟಾಗುವ ಬೆಳೆ ನಷ್ಟದಿಂದ ರೈತರನ್ನು ರಕ್ಷಿಸುವ ಸರ್ಕಾರಿ ಪ್ರಾಯೋಜಿತ ಬೆಳೆ ವಿಮಾ ಯೋಜನೆ.',
      visitPortal: 'ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಭೇಟಿ ನೀಡಿ'
    },
    'scheme-3': {
      title: 'ರೈತು ಬಂಧು ಯೋಜನೆ',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'ಬೀಜ, ಗೊಬ್ಬರ ಖರೀದಿಗೆ ರೈತರಿಗೆ ಪ್ರತಿ ಎಕરેಗೆ ₹5,000 ರಂತೆ ನೇರ ಬಂಡವಾಳ ನೆರವು ನೀಡುವ ತೆಲಂಗಾಣ ಸರ್ಕಾರದ ಯೋಜನೆ.',
      visitPortal: 'ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಭೇಟಿ ನೀಡಿ'
    }
  },
  bn: {
    'scheme-1': {
      title: 'প্রধানমন্ত্রী কিষাণ সম্মান নিধি (PM-KISAN)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'ক্ষুদ্র ও প্রান্তিক কৃষকদের বছরে তিন কিস্তিতে মোট ₹৬,০০০ সরাসরি আর্থিক সহায়তা দেওয়ার ভারত সরকারের প্রকল্প.',
      visitPortal: 'অফিসিয়াল ওয়েবসাইট দেখুন'
    },
    'scheme-2': {
      title: 'প্রধানমন্ত্রী ফসল বিমা যোজননা (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'আবহাওয়াজনিত কারণে ফসলের ক্ষয়ক্ষতি থেকে কৃষকদের রক্ষা করার জন্য সরকারি ফসল বিമാ প্রকল্প.',
      visitPortal: 'অফিসিয়াল ওয়েবসাইট দেখুন'
    },
    'scheme-3': {
      title: 'রায়তু বন্ধু প্রকল্প',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'তেলেঙ্গানা সরকারের একটি প্রকল্প যা বীজ ও সার কেনার জন্য প্রতি মরসুমে একর প্রতি ₹৫,০০০ সরাসরি সহায়তা দেয়.',
      visitPortal: 'অফিসিয়াল ওয়েবসাইট দেখুন'
    }
  },
  pa: {
    'scheme-1': {
      title: 'ਪੀਐਮ-ਕਿਸਾਨ (ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'ਭਾਰਤ ਸਰਕਾਰ ਦੀ ਇੱਕ ਪਹਿਲਕਦਮੀ ਜੋ ਛੋਟੇ ਅਤੇ ਸੀਮਾਂਤ ਕਿਸਾਨਾਂ ਨੂੰ ਸਾਲਾਨਾ ₹6,000 ਦੀ ਸਿੱਧੀ ਵਿੱਤੀ ਸਹਾਇਤਾ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ.',
      visitPortal: 'ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਦੇਖੋ'
    },
    'scheme-2': {
      title: 'ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'ਕੁਦਰਤੀ ਆਫ਼ਤਾਂ ਕਾਰਨ ਫਸਲਾਂ ਦੇ ਨੁਕਸਾਨ ਤੋਂ ਕਿਸਾਨਾਂ ਦੀ ਰੱਖਿਆ ਲਈ ਇੱਕ ਸਰਕਾਰੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ.',
      visitPortal: 'ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਦੇਖੋ'
    },
    'scheme-3': {
      title: 'ਰਾਇਤੂ ਬੰਧੂ ਯੋਜਨਾ',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'ਤੇਲੰਗਾਨਾ ਸਰਕਾਰ ਦੀ ਯੋਜਨਾ ਜੋ ਕਿਸਾਨਾਂ ਨੂੰ ਬੀਜ, ਖਾਦਾਂ ਆਦਿ ਲਈ ₹5,000 ਪ੍ਰਤੀ ਏਕੜ ਪ੍ਰਤੀ ਸੀਜ਼ਨ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ.',
      visitPortal: 'ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਦੇਖੋ'
    }
  },
  ml: {
    'scheme-1': {
      title: 'പിഎം-കിസാൻ (പ്രധാനമന്ത്രി കിസാൻ സമ്മാൻ നിധി)',
      category: 'Direct Income Support',
      targetCrop: 'All Crops',
      description: 'ചെറുകിട നാമമാത്ര കർഷകർക്ക് പ്രതിവർഷം ₹6,000 മൂന്ന് തുല്യ ഗഡുക്കളായി നൽകുന്ന കേന്ദ്ര സർക്കാർ പദ്ധതി.',
      visitPortal: 'ഔദ്യോഗിക വെബ്സൈറ്റ് സന്ദർശിക്കുക'
    },
    'scheme-2': {
      title: 'പ്രധാനമന്ത്രി ഫസൽ ബീമാ യോജന (PMFBY)',
      category: 'Crop Insurance',
      targetCrop: 'Food & Oilseed Crops',
      description: 'കാലാവസ്ഥാ വ്യതിയാനം മൂലമുള്ള വിളനഷ്ടത്തിൽ നിന്ന് കർഷകരെ സംരക്ഷിക്കുന്ന വിള ഇൻഷുറൻസ് പദ്ധതി.',
      visitPortal: 'ഔദ്യോഗിക വെബ്സൈറ്റ് സന്ദർശിക്കുക'
    },
    'scheme-3': {
      title: 'റൈതു ബന്ധു പദ്ധതി',
      category: 'State Investment Support',
      targetCrop: 'All Crops',
      description: 'വിത്തുകളും വളങ്ങളും വാങ്ങുന്നതിനായി തെലങ്കാന സർക്കാർ നൽകുന്ന ഏക്കറിന് ₹5,000 വീതമുള്ള സഹായ പദ്ധതി.',
      visitPortal: 'ഔദ്യോഗിക വെബ്സൈറ്റ് സന്ദർശിക്കുക'
    }
  }
};

// Fix minor typo in mr PMFBY scheme-2 titles
if (SCHEMES_TRANSLATIONS.mr && SCHEMES_TRANSLATIONS.mr['scheme-2']) {
  SCHEMES_TRANSLATIONS.mr['scheme-2'].title = 'प्रधानमंत्री पीक विमा योजना (PMFBY)';
}
if (SCHEMES_TRANSLATIONS.te && SCHEMES_TRANSLATIONS.te['scheme-1']) {
  SCHEMES_TRANSLATIONS.te['scheme-1'].title = 'పీఎం-కిసాన్ (PM-KISAN)';
}
