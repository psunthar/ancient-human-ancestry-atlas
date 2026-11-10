/* lineage tree: lanes, mixing links, and cross-in-circle marks */
export const LANES=[
{id:'nea',name:'Neanderthals',s:300,e:40},
{id:'den',name:'Denisovans',s:300,e:30},
{id:'afr',name:'African lineages',s:300,e:0},
{id:'onaf',name:'Out-of-Africa founders',s:70,e:50,from:'afr'},
{id:'aus',name:'Australasians',s:50,e:0,from:'onaf'},
{id:'aasi',name:'South Asian hunter-gatherers',s:50,e:7,from:'onaf'},
{id:'sas',name:'South Asians',s:7,e:0,from:'iran'},
{id:'eas',name:'East Eurasians',s:50,e:0,from:'onaf'},
{id:'nam',name:'First Americans',s:25,e:0,from:'eas'},
{id:'ane',name:'Ancient N. Eurasians',s:40,e:12,from:'wes'},
{id:'yam',name:'Steppe pastoralists',s:13,e:3,from:'ane'},
{id:'wes',name:'West Eurasians',s:50,e:8,from:'onaf'},
{id:'basal',name:'Basal Eurasians',s:60,e:10,from:'onaf',dash:true},
{id:'iran',name:'Iranian-related',s:20,e:5,from:'wes'},
{id:'ana',name:'Anatolian farmers',s:13,e:5,from:'wes'},
{id:'eur',name:'Europeans',s:8,e:0,from:'wes'}
];
export const LINKS=[
{f:'nea',to:'onaf',t:55},{f:'den',to:'aus',t:47},{f:'den',to:'eas',t:45},{f:'aus',to:'nam',t:14,hyp:1},{f:'ane',to:'nam',t:24},
{f:'basal',to:'iran',t:12},{f:'basal',to:'ana',t:11},{f:'ane',to:'yam',t:13.5},{f:'iran',to:'yam',t:12.8},
{f:'ana',to:'eur',t:7.5},{f:'yam',to:'eur',t:4.8},{f:'aasi',to:'sas',t:6.5},{f:'yam',to:'sas',t:3.8}
];
export const MARKS=[
{lane:'onaf',t:55,tip:'Neanderthal ancestry enters'},{lane:'aus',t:47,tip:'Denisovan ancestry (several percent)'},
{lane:'eas',t:45,tip:'Denisovan ancestry (small)'},{lane:'eas',t:2.7,tip:'Jomon and Yayoi ancestry mix (Japan)'},
{lane:'nam',t:22,tip:'ANE-related and East Asian-related ancestry combine'},{lane:'nam',t:14,tip:'"Population Y" signal (hypothesis)'},
{lane:'iran',t:12,tip:'Basal Eurasian ancestry'},{lane:'ana',t:11,tip:'Basal Eurasian ancestry'},
{lane:'eur',t:7,tip:'Farmers and hunter-gatherers mix'},{lane:'eur',t:4.8,tip:'Steppe ancestry arrives'},
{lane:'sas',t:3.7,tip:'Steppe ancestry arrives'},{lane:'sas',t:3.0,tip:'ANI and ASI mix'}
];
