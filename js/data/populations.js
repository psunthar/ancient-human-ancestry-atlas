/* populations: keys = [kya, lon, lat, radius in degrees], oldest first */
export const GROUPS=[
{id:'afr',name:'African lineages',short:'Africans',col:'#d98c2b',keys:[[300,20,0,28],[0,20,0,28]]},
{id:'nea',src:['nea','onaf'],name:'Neanderthals',short:'Neanderthals',col:'#9a6fb0',keys:[[300,10,46,14],[200,15,47,13],[130,30,46,14],[70,42,44,15],[45,0,42,10],[40,-5,39,5]]},
{id:'den',src:['den','aus'],name:'Denisovans',short:'Denisovans',col:'#c24f7a',keys:[[300,92,48,10],[200,94,44,14],[100,96,38,16],[50,100,28,18],[30,112,22,14]]},
{id:'onaf',name:'Out-of-Africa founders',short:'Founders',col:'#6b7c85',keys:[[70,34,12,6],[62,40,24,8],[55,42,33,9],[48,45,35,8]]},
{id:'basal',src:['basal','iran','ana'],name:'Basal Eurasians (ghost lineage, location unknown)',short:'Basal Eurasians?',col:'#808080',dash:true,keys:[[55,36,27,7],[30,38,30,8],[12,38,32,9]]},
{id:'wes',name:'Early West Eurasians (hunter-gatherers)',short:'W. Eurasians',col:'#2f7fd1',keys:[[45,28,44,8],[30,12,46,13],[14,12,47,13],[8,12,51,13],[5.5,14,51,10]]},
{id:'ane',name:'Ancient North Eurasians',short:'ANE',col:'#17a39a',keys:[[30,92,54,8],[24,103,53,8],[15,98,54,8],[12,94,55,8]]},
{id:'steppe',name:'Steppe hunter-gatherers (Eastern and Caucasus)',short:'Steppe HGs',col:'#e07a3f',keys:[[13,46,52,7],[8,46,50,7],[5.3,46,49,7]]},
{id:'yam',name:'Yamnaya and western descendants',short:'Yamnaya',col:'#b8341c',keys:[[5.3,46,49,7],[4.9,34,50,10],[4.6,20,50,12],[4.2,10,52,12],[3.6,10,52,12]]},
{id:'yame',name:'Steppe-related groups in Central and South Asia',short:'Steppe-related',col:'#b8341c',dash:true,keys:[[4.8,56,50,9],[4.3,66,46,10],[3.8,72,36,8],[3.3,76,30,8]]},
{id:'ana',name:'Anatolian farmers and early European farmers',short:'Farmers',col:'#8fb339',keys:[[11,36,38,5],[9,28,40,8],[8,22,43,9],[7,16,46,10],[6,6,48,12],[5,2,47,10]]},
{id:'iran',name:'Iranian-plateau groups',short:'Iranian-related',col:'#b58900',keys:[[13,48,34,6],[10,50,33,7],[8,56,33,8],[6,63,31,8],[5,66,30,8]]},
{id:'eas',name:'East Eurasians (hunter-gatherers)',short:'E. Eurasians',col:'#2aa7c9',keys:[[45,105,35,12],[30,110,36,14],[15,112,33,16],[9,112,34,13]]},
{id:'eaf',name:'East Asian farmers (millet and rice)',short:'E. Asian farmers',col:'#1e88a8',keys:[[9,112,34,6],[6,114,32,10],[4,112,30,14],[2,110,28,17],[0,110,30,19]]},
{id:'aus',name:'Australasians (Papuans, Aboriginal Australians)',short:'Australasians',col:'#a05a2c',keys:[[50,108,2,8],[48,120,-3,8],[45,134,-10,9],[40,140,-14,10],[0,137,-18,15]]},
{id:'aasi',name:'South Asian hunter-gatherers',short:'S. Asian HGs',col:'#4b50d6',keys:[[50,78,18,7],[40,78,18,7],[7,78,18,7]]},
{id:'ivc',name:'Indus Valley Civilization',short:'Indus Valley',col:'#8d5fd3',dash:true,keys:[[4.6,70,28,6],[3.9,72,27,6]]},
{id:'sas',name:'South Asians (ANI-ASI mixture)',short:'South Asians',col:'#4b50d6',keys:[[4.2,76,24,8],[0,78,22,10]]},
{id:'nam',name:'First Americans (moving front)',short:'First Americans',col:'#158f6f',keys:[[25,168,63,7],[16,190,65,8],[15.5,232,53,5],[15,238,40,8],[14.7,265,18,10],[14.5,285,-10,12],[14.3,288,-35,10],[13.5,292,-48,7],[10,292,-48,7]]},
{id:'nam2',name:'Native American lineages (north)',short:'Native Americans',col:'#158f6f',keys:[[10,260,40,22],[0,260,40,22]]},
{id:'nam3',name:'Native American lineages (south)',short:'Native Americans',col:'#158f6f',keys:[[10,298,-15,20],[0,298,-15,20]]}
];
export const GCOL={},GBY={};GROUPS.forEach(function(g){GCOL[g.id]=g.col;GBY[g.id]=g;});
