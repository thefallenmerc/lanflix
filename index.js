const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Cryptr = require('cryptr');
const uuid = require('uuid/v1');
const session = require('express-session');


const app = express();

// set ejs as view engine
app.set('view engine', 'ejs');
app.set('views', 'views');


// use express  body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// use .env
dotenv.config();


// init the sesion
app.use(session({ secret: process.env.APP_KEY, resave: true, saveUninitialized: true }));

// make crypter
const cryptr = new Cryptr(process.env.APP_KEY);

const seriesList = {};

const episodeList = {};

/**
 * 
 * @param {string} src
 * 
 * Function to get series from source 
 */
function getSeries(src) {
    if (!src) {
        return src + ' is not a valid source!';
    }
    if (seriesList[src] !== undefined) {
        return seriesList[src];
    }
    console.log('scanning series');
    const series = fs.readdirSync(src).filter(e => {
        const ePath = path.join(src, e);
        return fs.lstatSync(ePath).isDirectory();
    }).map(e => {
        const ePath = path.join(src, e);
        if (fs.lstatSync(ePath).isDirectory()) {
            return getDirWithDir(e, ePath, true);
        }
        else return e;
    });
    addSeriesToList(src, series);
    return series;
}

/**
 * 
 * @param {string} src 
 * @param {array} series 
 */
function addSeriesToList(src = '', series = []) {
    if (seriesList[src] === undefined) {
        seriesList[src] = series
    }
}

/**
 * Get dir with file
 * @param {*} name 
 * @param {*} abspath 
 */
function getDirWithFiles(name, abspath) {
    return {
        type: 'dir',
        name,
        path: abspath,
        content: getOnlyFiles(abspath, fs.readdirSync(abspath))
    };
}


/**
 * Get dir with dir
 * @param {*} name 
 * @param {*} abspath 
 * @param {*} getContent 
 */
function getDirWithDir(name, abspath, getContent = false) {
    return {
        type: 'dir',
        name,
        path: abspath,
        content: getContent ? getDirWithContent(abspath, fs.readdirSync(abspath)) : getOnlyDirectories(abspath, fs.readdirSync(abspath))
    };
}

/**
 *  get only files
 * @param {*} dirPath 
 * @param {*} dirContent 
 */
function getOnlyFiles(dirPath = '', dirContent = []) {
    return dirContent.filter(e => {
        const ePath = path.join(dirPath, e);
        return fs.lstatSync(ePath).isFile();
    }).map(e => {
        const ePath = path.join(dirPath, e);
        // const link = cryptr.encrypt(ePath);
        const shortLink = uuid(ePath);
        const episode = {
            name: e,
            path: ePath,
            // link,
            shortLink,
            type: 'file'
        };
        episodeList[shortLink] = episode;
        return episode;
    });
}

/**
 * Get only dirs
 * @param {*} dirPath 
 * @param {*} dirContent 
 */
function getOnlyDirectories(dirPath = '', dirContent = []) {
    return dirContent.filter(e => {
        const ePath = path.join(dirPath, e);
        return fs.lstatSync(ePath).isDirectory();
    });
}

/**
 * Get dir with content
 * @param {*} dirPath 
 * @param {*} dirContent 
 */
function getDirWithContent(dirPath = '', dirContent = []) {
    return dirContent.filter(e => {
        const ePath = path.join(dirPath, e);
        return fs.lstatSync(ePath).isDirectory();
    }).map(e => {
        const ePath = path.join(dirPath, e);
        return fs.lstatSync(ePath).isFile() ? {
            path: ePath,
            name: e,
            type: fs.lstatSync(ePath).isFile() ? 'file' : 'dir',
            content: null
        } : getDirWithFiles(e, ePath);
    });
}

app.get('/', (req, res) => {
    const src = req.query.src;
    const series = getSeries(src);
    return res.json({ episodeList, seriesList });
    return res.render('pages/index', {
        src,
        series
    });
});

app.get('/series', (req, res) => {
    return res.render('pages/series', { seriesList });
});

app.post('/series', (req, res) => {
    const { src } = req.body;
    if (src) {

    } else {
        const session = req.session;
        session.error = 'Source is required!'
        return res.redirect('/series');
    }
    return res.json(req.body);
})

app.listen(9876);