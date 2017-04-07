class Debug {
    debugMode: boolean = false;

    constructor() {
    }

    log(...args: any[]) {
        if (this.debugMode) {
            let date: Date = new Date(),
                year: string = date.getFullYear().toString(),
                month: string = date.getMonth().toString(),
                day: string = date.getDate().toString(),
                hours: string = date.getHours().toString(),
                minutes: string = date.getMinutes().toString(),
                seconds: string = date.getSeconds().toString(),
                milliseconds: string = date.getMilliseconds().toString();
            if (milliseconds.length === 1) {
                milliseconds = '00' + milliseconds;
            } else if (milliseconds.length === 2) {
                milliseconds = '0' + milliseconds;
            }
            if (seconds.length === 1) {
                seconds = '0' + seconds;
            }
            if (minutes.length === 1) {
                minutes = '0' + minutes;
            }
            if (hours.length === 1) {
                hours = '0' + hours;
            }
            if (day.length === 1) {
                day = '0' + day;
            }
            if (month.length === 1) {
                month = '0' + month;
            }
            if (year.length === 1) {
                year = '0' + year;
            }
            let changedArguments: Array<any> = [`${year}/${month}/${day} ${hours}:${minutes}:${seconds}:${milliseconds}`, '-'];
            for (let i = 0; i < arguments.length; i++) {
                changedArguments.push(arguments[i]);
            }
            console.log.apply(console, changedArguments);
        }
    }
}

let debug: Debug = new Debug();

export {Debug, debug};