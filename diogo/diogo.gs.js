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