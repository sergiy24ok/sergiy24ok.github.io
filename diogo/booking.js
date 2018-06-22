function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function initPhoneInput(){
    var input = $("#phone"),
        output = $("#output");

    input.intlTelInput({
        nationalMode: true,
        initialCountry: "auto",
        // initialCountry: "at",
        utilsScript: "js/utils.js", // just for formatting/placeholders etc
        geoIpLookup: function(callback) {
            $.get('https://ipinfo.io', function() {}, "jsonp").always(function(resp) {
                var countryCode = (resp && resp.country) ? resp.country : "AT";
                callback(countryCode);
            });
        },
    });

    // listen to "keyup", but also "change" to update when the user selects a country
    input.on("keyup change", function() {
        var intlNumber = input.intlTelInput("getNumber");
        if (intlNumber) {
            var m = (window.phoneMsg && window.phoneMsg.int) || "International: ";
            output.text(m + intlNumber);
        } else {
            var m = (window.phoneMsg && window.phoneMsg.cta) || "Please enter a number below";
            output.text(m);
        }
    });
}

$(document).ready(function(){

    var appUrl = 'https://script.google.com/macros/s/AKfycbxcOoYJmZvlqde7e3hrAazfFmmKo4iJCoJc93oDWW1AqJBGjROb/exec'; // Sergey's app
    // var appUrl = 'https://script.google.com/macros/s/AKfycbzAEKJ1QxRW971-UTkK35SRmxo2f98HdsZnp9sP/exec'; // Sara's app
    var appointmentDate;
    var $container = $('#picker');
    var selectedSlot;
    var muteConnErr = false;

    initPhoneInput();

    function dateSelected(date){
        selectedSlot = null;
        var d = formatDate(date);

        updTimeslots(d);
    }

    var i18n = window.pikaday_i18n || {
            previousMonth : 'Previous Month',
            nextMonth     : 'Next Month',
            months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
            weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
        };
    var tzList = moment.tz.names();
    var tzListFormatted = $.map(tzList, function (obj) {
        // obj.text = obj.text || obj.name; // replace name with the property used for the text
        return {
            id: obj,
            text: moment.tz(obj).format('Z z') + " " + obj
        }
    });
    var localTz = moment.tz.guess();
    console.log(tzListFormatted)
    $('#tz').select2({
        data: tzListFormatted
    });
    $('#tz').val(localTz).trigger('change');
    $('#tz').on('change.select2', function(){
        localTz = $('#tz').val();
        renderSlots();
    });

    var disabledDates = [];
    var picker = new Pikaday({
        field: document.getElementById('pikaday'),
        firstDay: 1,
        bound: false,
        container: document.getElementById('pc'),
        i18n: i18n,
        minDate: new Date(),
        firstDay: window.calendarStartsAt || 0,
        disableDayFn: function(date){
            return (date.getDay() === 0);
        },
        onSelect: dateSelected
    });


    var initD = getParameterByName('date', window.location.href);
    if (initD) {
        picker.setDate(initD);
        selectedSlot = null;
        updTimeslots(initD);
    }

    var locales = {
        'de': 'de-DE',
        'ru': 'ru-RU',
        'en': 'en-EN'
    };
    var lang = getParameterByName('lang', window.location.href) || window.language || 'en';

    function showPage(n){
        var classList = $('.pages').attr('class').split(/\s+/);
        $.each(classList, function(index, item) {
            if (item.substr(0,5) === 'show-') {
                $('.pages').removeClass(item);
            }
        });

        $('.pages').addClass('show-'+n);
    }

    function connError(){
        if (muteConnErr) {
            muteConnErr = false;
            return;
        }
        $.alert({
            type: 'red',
            boxWidth: '30%',
            useBootstrap: false,
            title: 'Oops ...',
            content: window.conn_err || 'Connection error. Try again.',
        });
    }

    $('.change-app').click(function(){
        showPage(1);
        selectedSlot = null;
        var d = formatDate(picker.getDate());
        updTimeslots(d);
        return false;
    });

    function toTimeZone(time, zone) {
        var format = 'hh:mm A';
        return moment(time, format).tz(zone).format(format);
    }

    var slotRequest, slotList = [];
    function renderSlots(){
        $('#slots').replaceWith($('<div />').attr('id', 'slots'));
        //$('#slots').children().remove();
        for (var i=0;i<slotList.length;i++) {
            var title = slotList[i].start;
            title = toTimeZone(new Date(title), localTz);

            var $a = $('<a />').text(title).addClass('app').attr('href', '#');
            $a.slot = slotList[i];

            $a.click(function (sl) {
                return function () {
                    $(this).siblings().remove();
                    selectedSlot = sl;
                    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    var str = new Date(sl.start).toLocaleString(locales[lang], options) + " <span class='slot'>" + toTimeZone(new Date(sl.start), localTz) + "</span>";
                    $('#app-time span').html(str);
                    showPage(2);
                    return false;
                };
            }(slotList[i]));

            $('#slots').append($a);
        }

        $("#slots").mCustomScrollbar({
            axis:"y",
            theme:"dark"
        });
    }

    function updTimeslots(date, live){
        var $slots = $('#slots');
        $('#no-slots').hide();
        $('#circularG').show();
        $slots.html('');

        if (slotRequest){
            muteConnErr = true;
            slotRequest.abort();
            $('#circularG').show();
        }

        var qString = '?date='+date;
        if (live) {
            qString += '&source=live';
        }
        slotRequest = $.get(appUrl+qString);
        slotRequest.fail(connError);
        slotRequest.always(function(){
            $('#circularG').hide();
        });



        //////////// for DEV puprposes ///////////////

        // var daySlots = [{"start":"2018-06-21T05:00:00.000Z","end":"2018-06-21T05:30:00.000Z"},{"start":"2018-06-21T05:50:00.000Z","end":"2018-06-21T06:20:00.000Z"},{"start":"2018-06-21T06:40:00.000Z","end":"2018-06-21T07:10:00.000Z"},{"start":"2018-06-21T07:30:00.000Z","end":"2018-06-21T08:00:00.000Z"},{"start":"2018-06-21T08:20:00.000Z","end":"2018-06-21T08:50:00.000Z"},{"start":"2018-06-21T09:10:00.000Z","end":"2018-06-21T09:40:00.000Z"},{"start":"2018-06-21T10:00:00.000Z","end":"2018-06-21T10:30:00.000Z"},{"start":"2018-06-21T10:50:00.000Z","end":"2018-06-21T11:20:00.000Z"},{"start":"2018-06-21T11:40:00.000Z","end":"2018-06-21T12:10:00.000Z"},{"start":"2018-06-21T12:30:00.000Z","end":"2018-06-21T13:00:00.000Z"},{"start":"2018-06-21T13:20:00.000Z","end":"2018-06-21T13:50:00.000Z"},{"start":"2018-06-21T14:10:00.000Z","end":"2018-06-21T14:40:00.000Z"},{"start":"2018-06-21T15:00:00.000Z","end":"2018-06-21T15:30:00.000Z"},{"start":"2018-06-21T15:50:00.000Z","end":"2018-06-21T16:20:00.000Z"},{"start":"2018-06-21T16:40:00.000Z","end":"2018-06-21T17:10:00.000Z"},{"start":"2018-06-21T17:30:00.000Z","end":"2018-06-21T18:00:00.000Z"},{"start":"2018-06-21T18:20:00.000Z","end":"2018-06-21T18:50:00.000Z"}];
        // slotList = daySlots;
        // renderSlots();

        /////////////////////////////////////////

        slotRequest.success(function(daySlots){
            slotList = daySlots;
            renderSlots();

        });


    }

    $('#book').click(function(){
        var form = $( "#details" );
        form.validate({
            rules: {
                email: 'email'
            }
        });

       if (!form.valid()){
           return;
       }

        var fdata = {
            name: $('#details .name input').val(),
            phone: $("#phone").intlTelInput("getNumber"),
            email: $('#details .email input').val(),
        };

        var data = $.extend({}, selectedSlot, fdata);
        $('#book').attr('disabled', true);
        var req = $.post( appUrl, {data: JSON.stringify(data)} );
        req.success(function(data){
            showPage(3);
            $('.page3').removeClass('is-ok').removeClass('is-again');

            if ('ok' == data) {
                $('.page3').addClass('is-ok');
                var d = formatDate(picker.getDate());
            } else {
                $('.page3').addClass('is-again');
            }
        });
        req.fail(connError);
        req.always(function(){
            $('#book').attr('disabled', false)
        });
    });

    $('.retry').click(function(){
        showPage(1);
        selectedSlot = null;
        $('#slots').html('');
        var d = formatDate(picker.getDate());
        updTimeslots(d, true);
        return false;
    });

});
