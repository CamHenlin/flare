var lineReader = require('line-reader');
var crate = require('node-crate');
var count = 0;

function Article() {
	this.title = "";
	this.timestamp = null;
	this.text = "";
}

var article = new Article();
var article_text;
var read_lines = false;

// read all lines:
lineReader.eachLine('enwiki-20140903-pages-articles.xml', function(line) {
	//console.log(line);
	if (read_lines) {
		if (line.indexOf('</text>') === -1) {
			//console.log('got end text');
			article_text += line;
		} else {
			article.text = article_text;
			//console.log('article text ' + article.text);
			read_lines = false;
		}
	} else {
		if (line.indexOf('<page>') !== -1) {
			//console.log('new page found');
			article = new Article();
		} else if (line.indexOf('<title>') !== -1) {
			article.title = line.replace('<title>','').replace('</title>','');
			//console.log('page title is ' + article.title);
		} else if (line.indexOf('<timestamp>') !== -1) {
			article.timestamp = line.replace('<timestamp>','').replace('</timestamp>','');
			//console.log('page timestamp is ' + article.timestamp);
		} else if (line.indexOf('<text') !== -1) {
			if (line.indexOf('</text>') !== -1) {
				//console.log('got short article text');
				article.text = '';
			} else {
				//console.log('got begin text');
				read_lines = true;
				article_text = '';
			}
		} else if (line.indexOf('</page>') !== -1) {
			//console.log('got page info, sending to db');
			sendArticle(article);
		}
	}
}).then(function () {
	console.log("done importing wikipedia");
});

function sendArticle(article) {
	if (count > 1783752) {
		//console.log(JSON.stringify({title: article.title, timestamp: article.timestamp, text: article.text}));
		crate.connect ('http://10.0.1.17:4200');
		//// or crate.connect ('http://localhost:4200')
		//// to use multiple nodes in round robin crate.connect ('http://host1:4200 http://host2:4200')
		//// to use https crate.connect ('https://host1:4200 https://host2:4200')
		crate.insert ('wikipedia', {title: article.title, timestamp: article.timestamp, text: article.text}).success(function() {
			console.log('inserted article #: '+count);

		});
	} else {
	}

	count++;
}