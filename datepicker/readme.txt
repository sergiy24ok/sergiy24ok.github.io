Usage:

Create calendar: 

var picker = new MyDatepicker('#datepicker', options);

first param: element or selector
second param: options (see http://multidatespickr.sourceforge.net/#option-addDates )


// add dates 
picker.getEl().multiDatesPicker('addDates', dates);

// get Dates
var datespicker.getEl().multiDatesPicker('getDates');


Three months in a row:

By default it creates 1 month. For 3 months pass options with numberOfMonths: [1, 3]  :
    new MyDatepicker('#datepicker', {numberOfMonths: [1, 3]});