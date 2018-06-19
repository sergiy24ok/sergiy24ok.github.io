
function getSlotsCalendarId(){
    var properties = PropertiesService.getScriptProperties();

    var ret = properties.getProperty('appointment_slots');
    return ret;
}

function getAppoinmentsCalendarId(){
    var properties = PropertiesService.getScriptProperties();

    var ret = properties.getProperty('appointments');
    return ret;
}

function getSpreadsheet(){
    var properties = PropertiesService.getScriptProperties();

    var id = properties.getProperty('spreadsheet');

    return SpreadsheetApp.openById(id);
}

function getSlotDuration(){
    var properties = PropertiesService.getScriptProperties();

    var ret = properties.getProperty('slot_duration');

    return ret*1;
}

function getSlotEvents(date){
    var cal = getSlotsCalendarId();
    var events = CalendarApp.getCalendarById(cal).getEventsForDay(date);

    return events;
}

function getCalendarEvents(start, end){
    var cal = getAppoinmentsCalendarId();
    var events = CalendarApp.getCalendarById(cal).getEvents(start, end);

    return events;
}

function logSlot(slot){
    var str = "";
    str += slot.start.getHours() + ":" + slot.start.getMinutes();
    str += " - ";
    str += slot.end.getHours() + ":" + slot.end.getMinutes();
    Logger.log(str);
}

// add leading "0" to minutes if less than 10
function logSlots(slots){
    for (j =0;j<slots.length;j++){
        logSlot(slots[j]);
    }
}

function padMin(min) {
    var min = '' + min;
    return min.length == 2 ? min : '0' + min;
}

function slotToStr(start, end){
    var str = "";
    str += start.getHours() + ":" + padMin(start.getMinutes());
    str += " - ";
    str += end.getHours() + ":" + padMin(end.getMinutes());

    return str;
}

function getSlots(d){
    var date = new Date(d);

    // events stored in separate calendar; each event means time available for booking (divided into smaller chunks)
    var slotEvents = getSlotEvents(date);

    // slot duration is stored in script properties; minutes
    var dur = getSlotDuration() * 60 * 1000;

    var slots = [];

    for (var i=0;i<slotEvents.length;i++){
        var slotEvt = slotEvents[i];
        var start = slotEvt.getStartTime();
        var end = slotEvt.getEndTime();

        var slotEnd = new Date(start.getTime() + dur);


        while (slotEnd.getTime() <= end) {
            // other events/appointment in main calendar blocking current appoinment slot
            var calEvents  = getCalendarEvents(start, slotEnd.getTime());
            // if no other appoinments and slot start is in future
            if (!calEvents.length && start >= new Date().getTime()) {
                slots.push({
                    start: start,
                    end: slotEnd,
                    title: slotToStr(start, slotEnd)
                });
            }

            // go to next slot
            start = new Date(slotEnd);
            slotEnd = new Date(slotEnd.getTime() + dur);
        }
    }

    return slots;
}

function doGet(request) {
    // date format: '2017-07-28'
    // month: 2017-07
    var d = request.parameters.date;
    if (!d) {
        d = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");
    }

    var source = request.parameters.source;
    var feature = request.parameters.feature;
    // https://script.google.com/macros/s/AKfycbzk8nTMADTqR3mtlAoh4L_C7Odev9D6y6qfY9SGXwta1ivk9aE/exec?date=2018-03-29&date=2018-03-30&feature=cache
    if ('cache' == feature) {
        for (var i=0;i<d.length;i++) {
            cacheDate(d[i]);
        }

        return ContentService.createTextOutput(JSON.stringify({status: "ok"})).setMimeType(ContentService.MimeType.JSON);
    }

    // https://script.google.com/macros/s/AKfycbzk8nTMADTqR3mtlAoh4L_C7Odev9D6y6qfY9SGXwta1ivk9aE/exec?date=2018-04&feature=cacheMonthAvail
    if ('cacheMonthAvail' == feature) {
        var params = d[0].split('-');
        var maval = cacheMonthAvail(params[1],params[0]);

        return ContentService.createTextOutput(JSON.stringify({status: "ok", avail: maval})).setMimeType(ContentService.MimeType.JSON);
    }

    if ('getMonthAvail' == feature){
        var params = d[0].split('-');
        var av = readMonthAvail(params[1],params[0]);

        return ContentService.createTextOutput(av).setMimeType(ContentService.MimeType.JSON);
    }

    // var n = request.parameters.n;
    if ('get5' == feature) {
        var _live = false;
        if ('live' == source) {
            _live = true;
        }
        var slots5 = JSON.stringify(getNdays(d[0], 5, _live));
        return ContentService.createTextOutput(slots5).setMimeType(ContentService.MimeType.JSON);
    }

    var slots;
    if ('live' == source) {
        slots = cacheDate(d[0]);
    } else {
        slots = readCache(d[0]);
    }

    // var slots = getSlots(d);
    var _slots = {};
    _slots[d[0]] = JSON.parse(slots);
    slots = JSON.stringify(_slots);

    return ContentService.createTextOutput(slots).setMimeType(ContentService.MimeType.JSON);
}

// Calculates slots for given date yyyy-MM-dd and write into cache spreadsheet
function cacheDate(date){
    if (!date) {
        date = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");
    }

    var slots = getSlots(date);
    var slotsCount = slots.length;
    slots = JSON.stringify(slots);
    var sheet = getSpreadsheet().getSheetByName('cache');
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var searchRow;
    for(var i = 0; i<data.length;i++){
        if(data[i][0] == date){
            searchRow = i+1;
            break;
        }
    }

    if (searchRow) {
        sheet.getRange("B" + searchRow).setValue(slots);
        sheet.getRange("C" + searchRow).setValue(new Date().getTime());
        sheet.getRange("D" + searchRow).setValue(slotsCount);
    } else {
        sheet.appendRow([date, slots, new Date().getTime(), slotsCount]);
    }

    var lastRow = sheet.getLastRow();
    sheet.getRange('A'+1+':'+'A'+lastRow).setNumberFormat('@STRING@');

    return slots;
}

// Cache all dates for given month
function cacheMonth(month, year){
    if (!month) {
        // cache current month
        month = new Date().getMonth() + 1;
        month = String(month);

        year = new Date().getFullYear();
        year = String(year);
    }

    if (1 == month.length) {
        month = '0' + month;
    }
    _m = month;

    if (month.length !== 2 || year.length !== 4) return;
    var d = year + '-' + month + '-01';

    var date = new Date(d);

    for (i=0;i<=31;i++) {
        cacheDate(d);
        date = new Date(date).setDate(date.getDate()+1);
        date = new Date(date);
        d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
        if (_m !== Utilities.formatDate(date, "GMT", "MM")) break;

    }
    // Load the library (key: MHMchiX6c1bwSqGM1PZiW_PxhMjh3Sh48).
    // var moment = Moment.load();
}

// cache n days from date d and on
function cacheNDays(d, n) {
    var date = new Date(d);

    for (i=1;i<=n;i++) {
        cacheDate(d);
        date = new Date(date).setDate(date.getDate()+1);
        date = new Date(date);
        d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
    }
}

function run14(){
    var date = new Date();
    var h = date.getHours();
    if (h< 7 || h>21) {
        return;
    };

    var d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
    cacheNDays(d, 14);

    // cache this month (availability map)
    var x = d.split('-');
    cacheMonthAvail(x[1], x[0]);
}
function run28(){
    var date = new Date();
    var h = date.getHours();
    if (h< 7 || h>21) {
        return;
    };

    date = new Date(date).setDate(date.getDate()+14);
    date = new Date(date);
    d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
    cacheNDays(d, 14);

    // cache next month (availability map)
    date = new Date()
    date = new Date(date).setDate(date.getDate()+30);
    date = new Date(date);
    d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
    var x = d.split('-');
    cacheMonthAvail(x[1], x[0]);
}
function run56(){
    var date = new Date();
    var h = date.getHours();
    if (h< 7 || h>21) {
        return;
    };

    date = new Date(date).setDate(date.getDate()+28);
    date = new Date(date);
    var d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
    cacheNDays(d, 28);

    // cache next+1 month (availability map)
    date = new Date()
    date = new Date(date).setDate(date.getDate()+60);
    date = new Date(date);
    d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
    var x = d.split('-');
    cacheMonthAvail(x[1], x[0]);
}
function run147(){
    var date = new Date();
    var h = date.getHours();
    if (h< 7 || h>21) {
        return;
    };

    date = new Date(date).setDate(date.getDate()+56);
    date = new Date(date);
    var d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
    cacheNDays(d, 91);

    // cache next+2 month (availability map)
    date = new Date()
    date = new Date(date).setDate(date.getDate()+90);
    date = new Date(date);
    d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
    var x = d.split('-');
    cacheMonthAvail(x[1], x[0]);
}

function readDateAvailabiltiy(d){
    var sheet = getSpreadsheet().getSheetByName('cache');
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var searchRow;
    for(var i = 0; i<data.length;i++){
        if(data[i][0] == d){
            searchRow = i+1;
            break;
        }
    }

    var ret, c;
    if (searchRow) {
        ret = sheet.getRange("D" + searchRow).getValue();
    } else {
        c = cacheDate(d);
        ret = JSON.parse(c).length;
    }

    return ret;
}

// get availability map for given month (from cache; if not available - prior caching)
function getMonthAvailability(month, year){
    if (!month) {
        // get current month
        month = new Date().getMonth() + 1;
        month = String(month);

        year = new Date().getFullYear();
        year = String(year);
    }

    if (1 == month.length) {
        month = '0' + month;
    }
    _m = month;

    if (month.length !== 2 || year.length !== 4) return;
    var d = year + '-' + month + '-01';

    var date = new Date(d);
    var result = {};
    for (i=0;i<=31;i++) {
        result[d] = readDateAvailabiltiy(d);
        date = new Date(date).setDate(date.getDate()+1);
        date = new Date(date);
        d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
        if (_m !== Utilities.formatDate(date, "GMT", "MM")) break;
    }

    return result;
}

// cache availability map
function cacheMonthAvail(month, year){
    if (1 == month.length) {
        month = '0' + month;
    }

    var key = year + "-" + month;
    var val = JSON.stringify(getMonthAvailability(month, year));
    var sheet = getSpreadsheet().getSheetByName('cache');
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var searchRow;
    for(var i = 0; i<data.length;i++){
        if(data[i][0] == key){
            searchRow = i+1;
            break;
        }
    }

    if (searchRow) {
        sheet.getRange("B" + searchRow).setValue(val);
        sheet.getRange("C" + searchRow).setValue(new Date().getTime());

    } else {
        sheet.appendRow([key, val, new Date().getTime()]);
        var lastRow = sheet.getLastRow();
        sheet.getRange('A'+1+':'+'A'+lastRow).setNumberFormat('@STRING@');
    }

    return val;
}

function readMonthAvail(month, year){
    if (1 == month.length) {
        month = '0' + month;
    }

    var key = year + "-" + month;

    var sheet = getSpreadsheet().getSheetByName('cache');
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var searchRow;
    for(var i = 0; i<data.length;i++){
        if(data[i][0] == key){
            searchRow = i+1;
            break;
        }
    }

    if (searchRow) {
        ret = sheet.getRange("B" + searchRow).getValue();
    } else {
        ret = cacheMonthAvail(month, year);
    }

    return ret;
}



function readCache(date){
    if (!date) {
        date = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");
    }

    var sheet = getSpreadsheet().getSheetByName('cache');
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var searchRow;
    for(var i = 0; i<data.length;i++){
        if(data[i][0] == date){
            searchRow = i+1;
            break;
        }
    }

    var slots;
    if (searchRow) {
        slots = sheet.getRange("B" + searchRow).getValue();
    } else {
        slots = cacheDate(date);
    }

    return slots;
}

function getNdays(d, n, live){
    // var n = 5;
    if (!n) {
        n = 5;
    }
    var half = n / 2 | 0;

    var date = new Date(d);
    var begin = new Date(date).setDate(date.getDate()-half);
    date = new Date(begin);
    var ret = {};

    var count = 0;
    while (count < n) {
        if (date - new Date() >= 0) {
            count++;
            d = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
            if (live) {
                ret[d] = JSON.parse(cacheDate(d));
            } else {
                ret[d] = JSON.parse(readCache(d));
                Logger.log
            }
        }

        date = new Date(date).setDate(date.getDate()+1);
        date = new Date(date);
    }

    return ret;
}

function test(){
    getNdays("2018-04-12", 5);
}

function createAppointment(){
    var cal = getSlotsCalendarId();

    var data = request.parameters.data;

    var title = data.title;
    var startTime = new Date(data.start);
    var endTime = new Date(data.end);

    CalendarApp.getCalendarById(cal).createEvent(title, startTime, endTime);
}

function doSendSMS(name, phone, lang, date, time){
    var url = PropertiesService.getScriptProperties().getProperty('SMS_URL');
    var token = PropertiesService.getScriptProperties().getProperty('SMS_token');
    var sender = PropertiesService.getScriptProperties().getProperty('SMS_sender');


    var tpl = HtmlService
        .createTemplateFromFile("SMS_" + lang).evaluate().getContent();


    var message = tpl.split('$name').join(name);
    message = message.split('$date').join(date);
    message = message.split('$time').join(time);
    // message = message.split('$title').join(title);

    var queryString = "?" + [
        'token=' + encodeURIComponent(token),
        'sender=' + encodeURIComponent(sender),

        'message=' + encodeURIComponent(message),
        'recipients.0.msisdn=' + encodeURIComponent(phone)
    ].join('&');

    if ('ru' == lang) {
        queryString += "&encoding=UCS2";
    }
    url = url+queryString;

    var res = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true
    });

    res = JSON.parse(res.getContentText());

    return res;
}

function getLangByPhone(phone){
    var rAt = /^\+?43/;

    var rRu = /^\+?7/;
    var rUa = /^\+?380/;;

    if (phone.match(rAt)) {
        return 'de';
    }

    if (phone.match(rRu) || phone.match(rUa)){
        return 'ru';
    }

    return 'en';
}

// send friendly reminders about tomorrow events
function sendSMS(){
    var today = new Date();
    var tomorrow = new Date(today.getTime()+1*3600000*24);
    var cal = CalendarApp.getCalendarById(getAppoinmentsCalendarId());
    var evts = cal.getEventsForDay(tomorrow);
    for (var i=0;i<evts.length;i++){
        var e = evts[i];
        var e_title = e.getTitle();

        var phone = e_title.split(' ').pop();
        var name = e_title.split(' ');
        name.pop();
        name = name.join(' ');

        // var phone = e.getTag('phone');
        var lang = e.getTag('lang');
        // var fname = e.getTag('fname');
        // var lname = e.getTag('lname');
        // var name = fname + " " + lname;
        // var title = e.getTag('title');

        // reformat phone if needed
        if (!phone.match(/^\+/)) {
            var _match = phone.match(/^0{1}(\d+)/);
            if (_match) {
                phone = "+43" + _match[1];
            }
        }

        _match = phone.match(/^0{2}(\d+)/);
        if (_match) {
            phone = "+" + _match[1];
        }

        if (!phone.match(/\d{7,}/)){
            phone = null;
        }

        if (!lang) {
            var lang = getLangByPhone(phone);
        }

        var start = e.getStartTime();
        var date = Utilities.formatDate(start, Session.getScriptTimeZone(), "yyyy-MM-dd");
        var time = Utilities.formatDate(start, Session.getScriptTimeZone(), "HH:mm");

        var sheet = getSpreadsheet().getSheetByName('SMS');
        var evtId = e.getId();
        var splitEventId = evtId.split('@');
        var eventURL = "https://www.google.com/calendar/event?eid=" + Utilities.base64Encode(splitEventId[0] + " " + getAppoinmentsCalendarId());
        var evtLink = '=HYPERLINK("'+eventURL+'","#")';



        if (phone) {
            // SMS reminder was sent already
            if (e.getTag('SMS.id')) {

                sheet.appendRow([name, phone, lang, evtLink, e.getTag('SMS.id'), 'Reminder was already sent']);
                continue;
            }

            // lang = lang || 'en';
            var res = doSendSMS(name, phone, lang, date, time);
            Logger.log(res);

            if (res.ids) {
                e.setTag('SMS.id', res.ids[0]);
                sheet.appendRow([name, phone, lang, evtLink, res.ids[0]]);
            } else if (res.message) {
                e.setTag('SMS.message', res.message);
                sheet.appendRow([name, phone, lang, evtLink, res.message]);
            }


        }

    }

}






function doPost(request){
    var cal = getAppoinmentsCalendarId();

    var data = request.parameters.data;
    data = JSON.parse(data);

    var title = data.title;
    var startTime = new Date(data.start);
    var endTime = new Date(data.end);
    var fname = data.fname;
    var lname = data.lname;
    var phone = data.phone;
    var email = data.email;
    var bd = data.birthday;
    var lang = data.lang;

    var appDate = Utilities.formatDate(startTime, CalendarApp.getTimeZone(), "dd MMMM yyyy");
    var appTime = Utilities.formatDate(startTime, CalendarApp.getTimeZone(), "HH:mm") + " - " + Utilities.formatDate(endTime, CalendarApp.getTimeZone(), "HH:mm");

    var sheet = getSpreadsheet().getSheetByName('appointments');

    var check = !getCalendarEvents(startTime, endTime).length;

    if (check) {
        var options = {};
        if (email) {
            options = {
                guests: email,
                sendInvites: true
            };
        }
        var evt = CalendarApp.getCalendarById(cal).createEvent(title + " " + fname + " " + lname + " " + phone, startTime, endTime, options);
        var evtId = evt.getId();

        var splitEventId = evtId.split('@');
        var eventURL = "https://www.google.com/calendar/event?eid=" + Utilities.base64Encode(splitEventId[0] + " " + cal);
        evtLink = '=HYPERLINK("'+eventURL+'","#")';

        var desc = ["", "Name:", fname, lname, "\n", "Phone: ", phone, "\n", "Email:", email, "\n", "Birthday:", bd].join(" ");
        evt.setDescription(desc);
        evt.setTag('phone', phone);
        evt.setTag('lang', lang);
        evt.setTag('fname', fname);
        evt.setTag('lname', lname);
        evt.setTag('title', title);
        sheet.appendRow([title, fname, lname, "'"+phone, email, bd, evtLink, appDate, appTime, lang, new Date(), 'ok']);
        return ContentService.createTextOutput("ok");
    } else {
        sheet.appendRow([title, fname, lname, "'"+phone, email, bd, '', appDate, appTime, lang, new Date(), 'fail']);
        return ContentService.createTextOutput("fail");
    }
}