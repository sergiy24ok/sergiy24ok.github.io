// open < File -> Project properties -> Script properties > to configure this script

function getSpreadsheet(){
  var properties = PropertiesService.getScriptProperties();

  var id = properties.getProperty('spreadsheet');
  
  return SpreadsheetApp.openById(id);
}

function getSettings(){
  var sheet = getSpreadsheet().getSheetByName('settings');
  var calendarId = sheet.getRange(2,2).getValue();
  var duration1 = sheet.getRange(3,2).getValue();
  var duration2 = sheet.getRange(4,2).getValue();
  var hour1 = sheet.getRange(5,2).getValue();
  var hour2 = sheet.getRange(6,2).getValue();
  var daysOff = sheet.getRange(7,2).getValue().split(',');
  
  var settings = {
    calendarId: calendarId,
    duration1: duration1,
    duration2: duration2,
    hour1: hour1,
    hour2: hour2,
    daysOff: daysOff
  };
  
  return settings;
}

// Get calendar events between 2 given timestamps
function getCalendarEvents(start, end){
  var cal = getSettings().calendarId;
  
  var events = CalendarApp.getCalendarById(cal).getEvents(new Date(start), new Date(end));
  
  return events;
}


function getSlots(d){
  var date = new Date(d);
  var settings = getSettings();
  
  var today = new Date().setHours(0,0,0);
  var tomorrow = new Date(today + 24 * 60 * 60 * 1000);
  tomorrow = Utilities.formatDate(tomorrow, CalendarApp.getTimeZone(), "yyyy-MM-dd");
  today = Utilities.formatDate(new Date(), CalendarApp.getTimeZone(), "yyyy-MM-dd");
  
  var duration1 = settings.duration1 * 60 * 1000;
  var duration2 = settings.duration2 * 60 * 1000;
  var duration = duration1 + duration2;
  
  var hour1 = settings.hour1;
  var hour2 = settings.hour2;
  var slots = [];
  
  
  var start = new Date(date).setHours(hour1);
  var end = new Date(date).setHours(hour2);
  var slotStart = new Date(start);
  var slotEnd = new Date(start + duration1);
  
  while (slotEnd.getTime() < end) {
    if (d == tomorrow && new Date().getHours() >= 19 && slotStart.getHours() < 10) {
      start = new Date(slotEnd.getTime() + duration2).getTime();
      slotStart = new Date(start);
      slotEnd = new Date(start + duration1);
      continue;
    }
    
    if (d == today && slotStart.getTime() < new Date().getTime() + 2*60*60*1000) {
      start = new Date(slotEnd.getTime() + duration2).getTime();
      slotStart = new Date(start);
      slotEnd = new Date(start + duration1);
      continue;
    }
    
    // other events/appointment in main calendar blocking current appoinment slot
    var calEvents  = getCalendarEvents(start - duration2, slotEnd.getTime() + duration2);
      // if no other appoinments and slot start is in future
      if (!calEvents.length && start >= new Date().getTime()) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          // title: slotToStr(start, slotEnd)
        });
        
        // CalendarApp.getCalendarById(getSettings().calendarId).createEvent("-", slotStart, slotEnd);
        
      }
      
      // go to next slot
      start = new Date(slotEnd.getTime() + duration2).getTime();
      slotStart = new Date(start);
      slotEnd = new Date(start + duration1);
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

    var feature = request.parameters.feature;

    slots = getSlots(d);

    slots = JSON.stringify(slots);

    return ContentService.createTextOutput(slots).setMimeType(ContentService.MimeType.JSON);
}

function doPost(request){
    var cal = getSettings().calendarId;
    var data = request.parameters.data;
    data = JSON.parse(data);
    var duration2 = getSettings().duration2;

    var startTime = new Date(data.start);
    var endTime = new Date(data.end);
    var name = data.name;
    var phone = data.phone;
    var email = data.email;

    var appDate = Utilities.formatDate(startTime, CalendarApp.getTimeZone(), "dd MMMM yyyy");
    var appTime = Utilities.formatDate(startTime, CalendarApp.getTimeZone(), "HH:mm") + " - " + Utilities.formatDate(endTime, CalendarApp.getTimeZone(), "HH:mm");

    var sheet = getSpreadsheet().getSheetByName('appointments');

    var check = !getCalendarEvents(new Date(startTime.getTime() - duration2), new Date(endTime) + duration2).length;

    if (check) {
        var options = {};
        if (email) {
            options = {
                guests: email,
                sendInvites: true
            };
        }
        var evt = CalendarApp.getCalendarById(cal).createEvent(name +  " " + phone, startTime, endTime, options);
        var evtId = evt.getId();

        var splitEventId = evtId.split('@');
        var eventURL = "https://www.google.com/calendar/event?eid=" + Utilities.base64Encode(splitEventId[0] + " " + cal);
        evtLink = '=HYPERLINK("'+eventURL+'","#")';

        var desc = ["", "Name:", name, "\n", "Phone: ", phone, "\n", "Email:", email, "\n"].join(" ");
        evt.setDescription(desc);
        evt.setTag('phone', phone);
        evt.setTag('name', name);
        sheet.appendRow([name,  "'"+phone, email,  evtLink, appDate, appTime, new Date(), 'ok']);
        return ContentService.createTextOutput("ok");
    } else {
        sheet.appendRow([name, "'"+phone, email, '', appDate, appTime, new Date(), 'fail']);
        return ContentService.createTextOutput("fail");
    }
}

function test(){
  var d = '2018-06-20';
  var slots = getSlots(d);

    slots = JSON.stringify(slots);
Logger.log(slots);
 
}