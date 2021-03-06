#!bin/python
from flask import Flask
from flask import send_from_directory
from flask import request
from flask import jsonify
from flask import session
from crate import client
from multiprocessing import Process, Queue
from gensim import corpora, models, similarities
import string
import json
import nltk
import pickle
from nltk.tokenize import word_tokenize
from nltk import NaiveBayesClassifier

from itertools import chain

#     __    ____  _________    __       ______  _______  ____  ____  ___________
#    / /   / __ \/ ____/   |  / /      /  _/  |/  / __ \/ __ \/ __ \/_  __/ ___/
#   / /   / / / / /   / /| | / /       / // /|_/ / /_/ / / / / /_/ / / /  \__ \
#  / /___/ /_/ / /___/ ___ |/ /___   _/ // /  / / ____/ /_/ / _, _/ / /  ___/ /
# /_____/\____/\____/_/  |_/_____/  /___/_/  /_/_/    \____/_/ |_| /_/  /____/
#

from sentiments import *

app = Flask(__name__)

#     _   ____  ________ __
#    / | / / / /_  __/ //_/
#   /  |/ / /   / / / ,<
#  / /|  / /___/ / / /| |
# /_/ |_/_____/_/ /_/ |_|
#

print 'initializing nltk vocabulary classifier'

classifier = None
vocabulary = set(chain(*[word_tokenize(i[0].lower()) for i in training_data]))

with open('nltk_classifier','rb') as nltk_classifier:
    classifier = pickle.load(nltk_classifier)

if (classifier == None):
	feature_set = [ ({ i : (i in word_tokenize(sentence.lower())) for i in vocabulary if len(i) > 3}, tag) for sentence, tag in training_data ]
	classifier = NaiveBayesClassifier.train(feature_set)

	with open('nltk_classifier', 'wb') as nltk_classifier:
		pickle.dump(classifier, nltk_classifier)
else:
	print 'loaded prior clasification file'

def bagOfWords(tweets):
	wordsList = []
	for (words, sentiment) in tweets:
		wordsList.extend(words)
	return wordsList

def wordFeatures(wordList):
	wordList = nltk.FreqDist(wordList)
	wordFeatures = wordList.keys()
	return wordFeatures

def getFeatures(doc):
	docWords = set(doc)
	feat = {}
	for word in wordFeatures:
		feat['contains(%s)' % word] = (word in docWords)
	return feat


import os
import re
import subprocess

def available_cpu_count():
    """ Number of available virtual or physical CPUs on this system, i.e.
    user/real as output by time(1) when called with an optimally scaling
    userspace-only program"""

    # cpuset
    # cpuset may restrict the number of *available* processors
    try:
        m = re.search(r'(?m)^Cpus_allowed:\s*(.*)$',
                      open('/proc/self/status').read())
        if m:
            res = bin(int(m.group(1).replace(',', ''), 16)).count('1')
            if res > 0:
                return res
    except IOError:
        pass

    # Python 2.6+
    try:
        import multiprocessing
        return multiprocessing.cpu_count()
    except (ImportError, NotImplementedError):
        pass

    # http://code.google.com/p/psutil/
    try:
        import psutil
        return psutil.NUM_CPUS
    except (ImportError, AttributeError):
        pass

print 'running on ' + str(available_cpu_count()) + ' cores'

#     ____  ____  __  ___________________
#    / __ \/ __ \/ / / /_  __/ ____/ ___/
#   / /_/ / / / / / / / / / / __/  \__ \
#  / _, _/ /_/ / /_/ / / / / /___ ___/ /
# /_/ |_|\____/\____/ /_/ /_____//____/
#

@app.route('/')
def root():
    return 'no default route'

@app.route('/client/<path:filename>')
def send_foo(filename):
    return send_from_directory('/home/flare/flare/client/', filename)

@app.route('/tables', methods = ['GET'])
def getTables():
	print 'fetching tables listing'
	connection = client.connect('http://10.0.1.14:4200')
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
	connection = client.connect('http://10.0.1.14:4200')
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

	session['active_data'] = []
	session['data_fields'] = []

	limit = 0
	for binding in decoded['bindings']:
		if (binding['to']['type'] == 'sentiment'):
			limit = 500

	for binding in decoded['bindings']:
		if (binding['to']['type'] == 'filter'):
			select_from_table(binding, limit)
		elif (binding['to']['type'] == 'similarity'):
			gensim_on_results(binding)
		elif (binding['to']['type'] == 'sentiment'):
			sentiment_on_results(binding)


	print 'returning query results'
	return jsonify({ 'results' : session['active_data'][0] })

def select_from_table(binding, limit):
	connection = client.connect('http://10.0.1.14:4200')
	cursor = connection.cursor()

	if (limit == 0):
		cursor.execute("select * from " + binding['from']['tableName'] + " where " + binding['from']['tableColumn'] + " like '%" + binding['to']['query'] + "%'")
	else:
		cursor.execute("select * from " + binding['from']['tableName'] + " where " + binding['from']['tableColumn'] + " like '%" + binding['to']['query'] + "%' limit " + str(limit))

	results = cursor.fetchall()

	num_fields = len(cursor.description)
	field_names = [i[0] for i in cursor.description]

	session['active_data'].append(results)
	session['data_fields'].append(field_names)

	cursor.close()
	connection.close()

def split_list(alist, wanted_parts=1):
	length = len(alist)
	return [ alist[i*length // wanted_parts: (i+1)*length // wanted_parts] for i in range(wanted_parts) ]

def sentiment_on_results(binding):
	print 'fetching sentiment on results'
	print binding
	sentimentQueryColumn =  binding['from']['tableColumn']

	results = session['active_data'][0]
	field_names = session['data_fields'][0]

	sentimentQueryColumnInt = 0
	for field_name in field_names:
		if field_name == sentimentQueryColumn:
			break
		else:
			sentimentQueryColumnInt = sentimentQueryColumnInt + 1

	count = 0
	worker_processes = []
	worker_queues = []
	out_results = []

	for result in split_list(results, available_cpu_count()):
		queue = Queue()
		worker = Process(target=sentiment_worker, args=(queue, sentimentQueryColumnInt, result))
		worker.start()
		worker_processes.append(worker)
		worker_queues.append(queue)

	for worker in worker_processes:
		count = count + 1
		print 'returning res ' + str(count) + ' of ' + str(len(worker_processes))
		worker.join()

	for queue in worker_queues:
		for i in range(0, (len(results) / available_cpu_count()) + 1):
			out_results.append(queue.get())

	session['active_data'][0] = out_results

out_results = []

stoplist = set('a able about across after all almost also am among an and any are as at be because been but by can cannot could dear did do does either else ever every for from get got had has have he her hers him his how however i if in into is it its just least let like likely may me might most must my neither no nor not of off often on only or other our own rather said say says she should since so some than that the their them then there these they this tis to too twas us wants was we were what when where which while who whom why will with would yet you your'.split())

def sentiment_worker(queue, sentimentQueryColumnInt, results):
	for result in results:
		sentence = result[sentimentQueryColumnInt].lower()

		for s in stoplist:
			string.replace(sentence, s, "")

		sentence = { i: (i in word_tokenize(sentence)) for i in vocabulary if len(i) > 3 }

		result.append(classifier.classify(sentence))
		# print result
		#print result
		queue.put(result)
	print 'done'
	return

def gensim_on_results(binding):
	print 'fetching gensim results'
	similarityQueryColumn =  binding['from']['tableColumn']

	print 'gensim similarity requested: '
	print binding

	results = session['active_data'][0]
	field_names = session['data_fields'][0]

	similarityQueryColumnInt = 0
	for field_name in field_names:
		if field_name == similarityQueryColumn:
			break
		else:
			similarityQueryColumnInt = similarityQueryColumnInt + 1

	result_documents = []
	for result in results:
		result_documents.append(result[similarityQueryColumnInt])

	# remove common words and tokenize
	stoplist = set('a able about across after all almost also am among an and any are as at be because been but by can cannot could dear did do does either else ever every for from get got had has have he her hers him his how however i if in into is it its just least let like likely may me might most must my neither no nor not of off often on only or other our own rather said say says she should since so some than that the their them then there these they this tis to too twas us wants was we were what when where which while who whom why will with would yet you your'.split())
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

	vec_bow = dictionary.doc2bow(unicode(binding['to']['query']).lower().split())
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
		result.append(out_sims[sims_count][1])
		out_results.append(result)
		sims_count = sims_count + 1

	print 'returning gensim results'
	print out_results

	session['active_data'][0] = out_results

	return



if __name__ == '__main__':
	app.secret_key = 'keyboard cat'
	app.run(debug = True, host='0.0.0.0', port = 80)
