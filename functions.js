const fs = require('fs')
const youtubedl = require('youtube-dl')
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
const lineReader = require('line-reader');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./ids/ids.json');
const db = low(adapter);

function submit () {
    let select = document.getElementById('select').value;

    db.defaults({ ids: [] })
    .write();

    if (select == 'mp4') {
        console.log('mp4')

        let ids = db.get('ids')
        .map('id')
        .value();

        for (let i = 0; i < ids.length; i++) {
            const video = youtubedl(`https://www.youtube.com/watch?v=${ids[i]}`,
                ['--format=18'],
                { cwd: __dirname });

            video.on('info', function(info) {
                console.log('Download started')
                console.log('filename: ' + info._filename)
                console.log('size: ' + info.size)
            });

            video.pipe(fs.createWriteStream(`./output/mp4/${ids[i]}.mp4`));
        }
    
    } else if (select == 'mp3') {
        console.log('mp3')
        
        let ids = db.get('ids')
                .map('id')
                .value();

        for (let i = 0; i < ids.length; i++) {
            var YD = new YoutubeMp3Downloader({
                "ffmpegPath": "./ffmpeg/ffmpeg",
                "outputPath": "./output/mp3",
                "youtubeVideoQuality": "highestaudio",
                "queueParallelism": 2,
                "progressTimeout": 2000,
                "allowWebm": false
            });
        
            YD.download(ids[i]);
            
            YD.on("finished", function(err, data) {
                console.log(JSON.stringify(data));
            });
             
            YD.on("error", function(error) {
                console.log(error);
            });
             
            YD.on("progress", function(progress) {
                console.log(JSON.stringify(progress));
            });
        }
        
    } else if (select == 'parseid') {
        db.get('ids')
        .remove()
        .write();

        let id = 1;

        lineReader.eachLine('./ids/links.txt', (line) => {
            if (line.includes('youtu.be')) {
                let arr = line.split('.be/');
    
                db.get('ids')
                .push({ no: id, id: arr[1]})
                .write();

                id++;
            } else {
                let arr = line.split('?v=');
    
                db.get('ids')
                .push({ no: id, id: arr[1]})
                .write();

                id++;
            }
        });
    }
}