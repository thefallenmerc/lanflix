const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Cryptr = require('cryptr');


const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

dotenv.config();

const cryptr = new Cryptr(process.env.APP_KEY);

const seriesList = [];

const episodeList = [];
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

function addSeriesToList(src = '', series = []) {
    if (seriesList[src] === undefined) {
        seriesList[src] = series
    }
}

function getDirWithFiles(name, abspath) {
    return {
        type: 'dir',
        name,
        path: abspath,
        content: getOnlyFiles(abspath, fs.readdirSync(abspath))
    };
}

function getDirWithDir(name, abspath, getContent = false) {
    return {
        type: 'dir',
        name,
        path: abspath,
        content: getContent ? getDirWithContent(abspath, fs.readdirSync(abspath)) : getOnlyDirectories(abspath, fs.readdirSync(abspath))
    };
}

function getOnlyFiles(dirPath = '', dirContent = []) {
    return dirContent.filter(e => {
        const ePath = path.join(dirPath, e);
        return fs.lstatSync(ePath).isFile();
    }).map(e => {
        const ePath = path.join(dirPath, e);
        episodeList.push(ePath);
        return {
            name: e,
            path: ePath,
            link: cryptr.encrypt(ePath),
            type: 'file'
        }
    });
}

function getOnlyDirectories(dirPath = '', dirContent = []) {
    return dirContent.filter(e => {
        const ePath = path.join(dirPath, e);
        return fs.lstatSync(ePath).isDirectory();
    });
}

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
    console.log('-----------------------------------------------------');
    console.log(episodeList);
    console.log('-----------------------------------------------------');
    return res.render('pages/index', {
        src,
        series
    });
});

app.listen(9876);