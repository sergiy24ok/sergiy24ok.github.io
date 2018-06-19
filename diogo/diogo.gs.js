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
    var cal = getAppoinmentsCalendarId();

    var data = request.parameters.data;
    data = JSON.parse(data);

    var startTime = new Date(data.start);
    var endTime = new Date(data.end);
    var name = data.name;
    var phone = data.phone;
    var email = data.email;

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
        var evt = CalendarApp.getCalendarById(cal).createEvent(title + " " + name +  " " + phone, startTime, endTime, options);
        var evtId = evt.getId();

        var splitEventId = evtId.split('@');
        var eventURL = "https://www.google.com/calendar/event?eid=" + Utilities.base64Encode(splitEventId[0] + " " + cal);
        evtLink = '=HYPERLINK("'+eventURL+'","#")';

        var desc = ["", "Name:", name, "\n", "Phone: ", phone, "\n", "Email:", email, "\n"].join(" ");
        evt.setDescription(desc);
        evt.setTag('phone', phone);
        evt.setTag('fname', fname);
        sheet.appendRow([title, name,  "'"+phone, email,  evtLink, appDate, appTime, new Date(), 'ok']);
        return ContentService.createTextOutput("ok");
    } else {
        sheet.appendRow([title, name, "'"+phone, email, '', appDate, appTime, new Date(), 'fail']);
        return ContentService.createTextOutput("fail");
    }
}