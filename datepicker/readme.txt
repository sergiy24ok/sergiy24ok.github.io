Usage: 

Create calendar: 


var picker = new MyDatepicker('#datepicker', options); /** I changed "MyDatepicker" to "nameItAsYouWish" : you can replace it in row 1 of multipick.js and use accordingly

first param: element or selector
second param: options (see http://multidatespickr.sourceforge.net/#option-addDates )


// add dates 
picker.getEl().multiDatesPicker('addDates', dates);

// get Dates
var datespicker.getEl().multiDatesPicker('getDates');


Three months in a row:

By default it creates 1 month. For 3 months pass options with numberOfMonths: [1, 3]  :
    new MyDatepicker('#datepicker', {numberOfMonths: [1, 3]});

This is my custom styles:

.ui-datepicker .ui-datepicker-calendar .ui-state-highlight a {
    background: #743620 none; /* a color that fits the widget theme */
    color: white; /* a color that is readeable with the color above */
}

// highlight range during drag
.ui-datepicker .ui-datepicker-calendar td.pre-selected a {
    background: red; /* a color that fits the widget theme */
    color: white; /* a color that is readeable with the color above */
}