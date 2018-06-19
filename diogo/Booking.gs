
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
      var calEvents  = getCalendarEvents(start, slotEnd);
      
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

function test(){
 
}

function doGet(request) {
  // date format: '2017-07-28'
  var d = request.parameters.date;
  if (!d) {
    d = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");
  }
  
  var slots = getSlots(d);
  
  return ContentService.createTextOutput(JSON.stringify(slots)).setMimeType(ContentService.MimeType.JSON);;
}

function createAppointment(){
  var cal = getSlotsCalendarId();
  
  var data = request.parameters.data;
   
  var title = data.title;
  var startTime = new Date(data.start);
  var endTime = new Date(data.end);
  
  CalendarApp.getCalendarById(cal).createEvent(title, startTime, endTime);
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
  
  var appDate = Utilities.formatDate(startTime, "GMT", "dd MMMM yyyy");
  var appTime = Utilities.formatDate(startTime, CalendarApp.getTimeZone(), "HH:mm") + " - " + Utilities.formatDate(endTime, CalendarApp.getTimeZone(), "HH:mm");
  
  var sheet = getSpreadsheet().getActiveSheet();
  
  var check = !getCalendarEvents(startTime, endTime).length;
 
  if (check) {
    var options = {};
    if (email) {
      options = {
        guests: email,
        sendInvites: true
      };
    }
    var evt = CalendarApp.getCalendarById(cal).createEvent(fname + " " + lname, startTime, endTime, options);
    var evtId = evt.getId();
    
    var splitEventId = evtId.split('@');
    var eventURL = "https://www.google.com/calendar/event?eid=" + Utilities.base64Encode(splitEventId[0] + " " + cal);
    evtLink = '=HYPERLINK("'+eventURL+'","#")';
    
    var desc = ["", "Name:", fname, lname, "\n", "Phone: ", phone, "\n", "Email:", email, "\n", "Birthday:", bd].join(" ");
    evt.setDescription(desc);
    sheet.appendRow([title, fname, lname, "'"+phone, email, bd, evtLink, appDate, appTime, lang, new Date(), 'ok']);
    return ContentService.createTextOutput("ok");
  } else {
    sheet.appendRow([title, fname, lname, "'"+phone, email, bd, '', appDate, appTime, lang, new Date(), 'fail']);
    return ContentService.createTextOutput("fail");
  }
}
