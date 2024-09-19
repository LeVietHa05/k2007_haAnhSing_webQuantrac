const option = {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transport: ["websocket", "polling"],
        credential: true,
    }
}

const { log } = require("console");
// fs sync file envir data
const fs = require("fs");

let envirData = fs.readFileSync("envirData.json", "utf-8");
envirData = JSON.parse(envirData);
//watch file envir data
fs.watch("envirData.json", (event, filename) => {
    envirData = fs.readFileSync("envirData.json");
    envirData = JSON.parse(envirData);
});

const MAX_DATA_LENGTH = 30;

const tmpData = {
    TEMP: [],
    HUM: [],
    CO2: [],
    CO: [],
    LPG: [],
    CH4: [],
    DUST: [],
}

let tmpAvg = {
    TEMP: 0,
    HUM: 0,
    CO2: 0,
    CO: 0,
    LPG: 0,
    CH4: 0,
    DUST: 0,
}

const io = require("socket.io")(option);

const socketapi = {
    io: io
}


io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("/esp/measure", (data) => {
        console.log(`Received data from ESP32: ${data}`);
        for (let key in data.data) {
            if (tmpData[key]) {
                tmpData[key].push(data.data[key]);
            }
        }

        // calculate average
        if (tmpData.TEMP.length == MAX_DATA_LENGTH) {
            log("Calculating average data");
            for (let key in tmpData) {
                tmpAvg[key] = tmpData[key].reduce((a, b) => a + b, 0) / tmpData[key].length;
                tmpAvg[key] = Math.round(tmpAvg[key] * 100) / 100;
                tmpData[key] = [];
            }
            let newData = {
                id: envirData.length + 1,
                date: new Date().toISOString().slice(0, 10),
                time: new Date().toLocaleTimeString("en-US", { hourCycle: "h24" }),
                data: {
                    TEMP: tmpAvg.TEMP,
                    HUM: tmpAvg.HUM,
                    CO2: tmpAvg.CO2,
                    CO: tmpAvg.CO,
                    LPG: tmpAvg.LPG,
                    CH4: tmpAvg.CH4,
                    DUST: tmpAvg.DUST
                },
                location: data.location ? data.location : { "latitute": null, "longitute": null }
            }
            if (envirData) {
                envirData.push(newData);
                fs.writeFileSync("envirData.json", JSON.stringify(envirData));
            }
        }
        socket.broadcast.emit("/web/measure", data)
    })

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
    socket.on("chat message", (msg) => {
        console.log("message: " + msg);
        io.emit("chat message", msg);
    });
});

module.exports = { socketapi, envirData };