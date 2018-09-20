'use strict';

const MetricsRepository = require('./dist/commonjs/index').MetricsRepository;

function registerInContainer(container) {

  container
    .register('MetricsRepository', MetricsRepository)
    .configure('process_engine:metrics_repository')
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
