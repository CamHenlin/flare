#!bin/python
from flask import Flask
from flask import send_from_directory
from flask import request
from flask import jsonify
from crate import client
import json
from gensim import corpora, models, similarities


app = Flask(__name__)

@app.route('/')
def root():
    return 'no default route'

@app.route('/client/<path:filename>')
def send_foo(filename):
    return send_from_directory('/Users/camhenlin/Documents/flair/client/', filename)

@app.route('/tables', methods = ['GET'])
def getTables():
	print 'fetching tables listing'
	connection = client.connect('http://10.0.1.17:4200')
	cursor = connection.cursor()

	cursor.execute("select table_name from information_schema.tables where schema_name = 'doc'")
	results = cursor.fetchall()

	results_out = []
	for result in results:
		print result[0]
		results_out.append(result[0])

	cursor.close()
	connection.close()

	print 'returning tables listing'
	return jsonify({ 'tables' : results_out })

@app.route('/columns/<table>', methods = ['GET'])
def getColumns(table):
	print 'fetching column listing'
	connection = client.connect('http://10.0.1.17:4200')
	cursor = connection.cursor()

	cursor.execute("select table_name, column_name, data_type from information_schema.columns where schema_name = 'doc' and table_name = '" + table + "'")
	results = cursor.fetchall()

	results_out = []
	for result in results:
		results_out.append(result[1])

	cursor.close()
	connection.close()

	print 'returning column listing'
	return jsonify({ 'columns' : results_out })

@app.route('/query', methods = ['POST'])
def queryData():
	print 'fetching query results'
	decoded = json.loads(request.data)

	print 'query requested: '
	print decoded

	connection = client.connect('http://10.0.1.17:4200')
	cursor = connection.cursor()

	cursor.execute("select * from " + decoded['bindings'][0]['from']['tableName'] + " where " + decoded['bindings'][0]['from']['tableColumn'] + " like '%" + decoded['bindings'][0]['to']['query'] + "%'")
	results = cursor.fetchall()

	cursor.close()
	connection.close()
	print 'returning query results'
	return jsonify({ 'results' : results })

@app.route('/gensimquery', methods = ['POST'])
def gensimQuery():
	print 'fetching gensim results'
	similarityQueryColumn = 'text' # this will be user settable in the future

	decoded = json.loads(request.data)
	print 'gensim similarity requested: '
	print decoded

	connection = client.connect('http://10.0.1.17:4200')
	cursor = connection.cursor()

	cursor.execute("select * from " + decoded['bindings'][0]['from']['tableName'] + " where " + decoded['bindings'][0]['from']['tableColumn'] + " like '%" + decoded['bindings'][0]['to']['query'] + "%'")
	results = cursor.fetchall()

	num_fields = len(cursor.description)
	field_names = [i[0] for i in cursor.description]

	similarityQueryColumnInt = 0
	for field_name in field_names:
		if field_name == similarityQueryColumn:
			break
		else:
			similarityQueryColumnInt = similarityQueryColumnInt + 1

	result_documents = []
	for result in results:
		result_documents.append(result[similarityQueryColumnInt])

	cursor.close()
	connection.close()

	# remove common words and tokenize
	stoplist = set('for a of the and to in'.split())
	texts = [[word for word in unicode(document).lower().split() if word not in stoplist]
		for document in result_documents]

	# remove words that appear only once
	all_tokens = sum(texts, [])
	tokens_once = set(word for word in set(all_tokens) if all_tokens.count(word) == 1)
	texts = [[word for word in text if word not in tokens_once]
		for text in texts]

	dictionary = corpora.Dictionary(texts)
	corpus = [dictionary.doc2bow(text) for text in texts]

	lsi = models.LsiModel(corpus, id2word=dictionary, num_topics=2)

	vec_bow = dictionary.doc2bow(unicode(decoded['bindings'][1]['to']['query']).lower().split())
	vec_lsi = lsi[vec_bow] # convert the query to LSI space

	index = similarities.MatrixSimilarity(lsi[corpus])

	sims = index[vec_lsi]
	sims = sorted(enumerate(sims), key=lambda item: item[0])# 0 is order from first sql query

	out_sims = []

	for sim in sims:
		sim = list(sim)
		sim[1] = str(sim[1])
		out_sims.append(sim)

	sims_count = 0
	out_results = []
	for result in results:
		result.append(out_sims[sims_count])
		out_results.append(result)
		sims_count = sims_count + 1

	print 'returning gensim results'
	return jsonify({ 'results' : out_results })

if __name__ == '__main__':
	app.run(debug = True, host='0.0.0.0', port = 7000)