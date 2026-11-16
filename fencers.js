/* fencers.js: the list of fencers shown on the roster page and in the header search.
   To add a fencer: drop their data file in data/ (same format as data/SeohaKim.js) and add one line here.
   id    short unique name, used in the address (?f=id)
   file  path to the data file
   The other fields only feed the roster table, so keep them in step with the data file. */
const FENCERS=[
  {id:'SeohaKim',name:'Seoha Kim',club:'Sabio Fencing Academy',born:'2010-05',file:'data/SeohaKim.js'},
  {id:'JohnDoe',name:'John Doe',club:'Example Fencing Club',born:'2009-03',file:'data/JohnDoe.js'},
];
