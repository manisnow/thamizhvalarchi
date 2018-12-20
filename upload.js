
var express = require('express')
var app = express()
var AWS = require('aws-sdk');
var bodyParser = require('body-parser');
var fs = require('fs');
var zlib = require('zlib'); 


//const s3 = new AWS.s3({accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});

AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
AWS.config.region = 'us-east-1';

const IncomingForm = require('formidable').IncomingForm;

module.exports = function upload(req, res) {
    var form = new IncomingForm();
//
form.on('file', (field, file) => {
	var s3 = new AWS.S3();
    // Do something with the file
    // e.g. save it to the database
    // you can access it usiNg file.path
     console.log( file.path)

var buffer = fs.readFileSync(file.path);

  var startTime = new Date();
  var partNum = 0;
  var partSize = 1024 * 1024 * 5; // 5mb chunks except last part
  var numPartsLeft = Math.ceil(buffer.length / partSize);
  var maxUploadTries = 3;



var multipartParams = {
    Bucket: 'buckettestmani',
    Key: file.name,
    ContentType: file.type
  };

  var multipartMap = {
    Parts: []
  };

  console.log('Creating multipart upload for:', file.name);
  s3.createMultipartUpload(multipartParams, function(mpErr, multipart) {
    if (mpErr) return console.error('Error!', mpErr);
    console.log('Got upload ID', multipart.UploadId);

    for (var start = 0; start < buffer.length; start += partSize) {
      partNum++;
      var end = Math.min(start + partSize, buffer.length);
      var partParams = {
        Body: buffer.slice(start, end),
        Bucket: multipartParams.Bucket,
        Key: multipartParams.Key,
        PartNumber: String(partNum),
        UploadId: multipart.UploadId
      };

      console.log('Uploading part: #', partParams.PartNumber, ', Start:', start);
      uploadPart(s3, multipart, partParams);
    }
  });


function completeMultipartUpload(s3, doneParams) {
    s3.completeMultipartUpload(doneParams, function(err, data) {
      if (err) return console.error('An error occurred while completing multipart upload');
      var delta = (new Date() - startTime) / 1000;
      console.log('Completed upload in', delta, 'seconds');
      console.log('Final upload data:', data);
    });
  }

  function uploadPart(s3, multipart, partParams, tryNum) {
    var tryNum = tryNum || 1;
    s3.uploadPart(partParams, function(multiErr, mData) {
      console.log('started');
      if (multiErr) {
        console.log('Upload part error:', multiErr);

        if (tryNum < maxUploadTries) {
          console.log('Retrying upload of part: #', partParams.PartNumber);
          uploadPart(s3, multipart, partParams, tryNum + 1);
        } else {
          console.log('Failed uploading part: #', partParams.PartNumber);
        }
        // return;
      }

      multipartMap.Parts[this.request.params.PartNumber - 1] = {
        ETag: mData.ETag,
        PartNumber: Number(this.request.params.PartNumber)
      };
      console.log('Completed part', this.request.params.PartNumber);
      console.log('mData', mData);
      if (--numPartsLeft > 0) return; // complete only when all parts uploaded

      var doneParams = {
        Bucket: multipartParams.Bucket,
        Key: multipartParams.Key,
        MultipartUpload: multipartMap,
        UploadId: multipart.UploadId
      };

      console.log('Completing upload...');
      completeMultipartUpload(s3, doneParams);
    }).on('httpUploadProgress', function(progress) {  console.log(Math.round(progress.loaded/progress.total*100)+ '% done') });
  



}

  
});
form.on('end', () => {
    res.json();
});
form.parse(req);
};



