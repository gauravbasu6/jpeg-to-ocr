const express = require('express');
const app = express();
const path = require("path");
const fs = require('fs');
const multer = require('multer');
const { createWorker } = require('tesseract.js');

const worker = createWorker();

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, './uploads')
    },
    filename: (req, file, cb)=>{
        cb(null,file.originalname);
    }
});
const upload = multer({ storage: storage }).single('uploadedFile');

app.set('view engine','ejs');
app.set("views", path.join(__dirname, "views"));


app.get('/download',(req,res)=>{
    const file = `${__dirname}/tesseract-ocr-result.pdf`; //Downloads file automatically.
    res.download(file);
})

app.get('/',(req,res)=>{
    res.render('index');
})


app.post('/upload', (req,res)=>{
    upload(req,res,err =>{
        fs.readFile(`./uploads/${req.file.originalname}`,(err,image)=>{
            if(err) return console.log('ERROR',err);
            
            (async () => {
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text } } = await worker.recognize(image);
                const { data } = await worker.getPDF('Tesseract OCR Result');
                fs.writeFileSync('tesseract-ocr-result.pdf', Buffer.from(data));
                console.log('Generate PDF: tesseract-ocr-result.pdf');
                res.redirect('/download');
                await worker.terminate();
            })();
        });
    });
});


app.listen(3000,()=>{
    console.log("listening on port 3000");
})