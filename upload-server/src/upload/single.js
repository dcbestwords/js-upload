//表单形式上传单文件
const config = require('../config');
const multer = require('multer');
const upload = multer({
  dest: config.global.uploadPath,
  limits: {
    fileSize: config.single.sizeLimit,
  },
  //类型验证
  fileFilter(req, file, cb) {
    const path = require('path');
    const ext = path.extname(file.originalname);
    if (config.single.exts.includes(ext)) {
      cb(null, true);//accept
    } else {
      const { ExtError } = require('./errorTypes');
      cb(new ExtError());
    }
  },
});

const express = require('express');
const router = express.Router();
router.post('/', async (req, res, next) => {
  upload.single(config.single.fieldName)(req, res, async (err) => {
    //大小验证
    if (err instanceof multer.MulterError) {
      const { SizeLimitError, UnexpectedRequest } = require('./errorTypes');
      if (err.message === 'File too large') {
        err = new SizeLimitError();
      } else {
        err = new UnexpectedRequest();
      }
    }
    if (err) {
      next(err);
      return;
    }
    //save file
    const { suffix, generateUrl } = require('./utils');
    const file = req.file;
    const filename = suffix(file.originalname, file.filename);
    const fs = require('fs');
    await fs.promises.rename(file.path, `${file.destination}/${filename}`);
    const url = generateUrl(req, filename);
    res.send({
      data: url,
    });
  });
});

module.exports = router;
