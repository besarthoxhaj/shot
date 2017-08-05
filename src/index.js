'use strict';

const fs = require('fs-extra');
const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');

module.exports = async function({
  outputDir,
  inputDir,
  inputFile,
}={}) {

  if(!outputDir || !inputFile || !inputDir) {
    throw new Error([
      'DomShot needs an inputFile and outputDir',
      'one of them is missing. Please check your',
      'init config.'
    ].join(' '));
  }

  fs.ensureDirSync(outputDir);
  const isFile = fs.existsSync(inputFile);
  if(isFile === false) {
    fs.ensureFileSync(inputFile);
    fs.writeFileSync(inputFile,"{}");
  }

  const jsonStore = fs.readJsonSync(inputFile);

  // ===================================================================

  const launchConfig = {
    chromeFlags: [
      '--headless',
      '--disable-translate',
      '--disable-extensions',
      '--disable-background-networking',
      '--safebrowsing-disable-auto-update',
      '--disable-sync',
      '--metrics-recording-only',
      '--disable-gpu',
    ]
  };

  // ===================================================================

  const chrome = await chromeLauncher.launch(launchConfig);
  const client = await CDP({port:chrome.port});
  const { Page } = client;
  await Page.enable();

  for(var numId in jsonStore) {

    const htmlFile = fs.readFileSync(inputDir + '/' + numId + '.html', 'utf8');
    await Page.navigate({url:`data:text/html,${htmlFile}`});
    await Page.loadEventFired();
    const image = await Page.captureScreenshot();
    fs.writeFileSync(
      outputDir + '/' + numId + '.png',
      image.data,
      {encoding:'base64'}
    );
  }

  await chrome.kill();
}
