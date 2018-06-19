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

    var appUrl = 'https://script.google.com/macros/s/AKfycbxcOoYJmZvlqde7e3hrAazfFmmKo4iJCoJc93oDWW1AqJBGjROb/exec';
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
    var disabledDates = [];
    var picker = new Pikaday({
        field: document.getElementById('pikaday'),
        firstDay: 1,
        bound: false,
        container: document.getElementById('pc'),
        i18n: i18n,
        minDate: new Date(),
        firstDay: window.calendarStartsAt || 0,
        onSelect: dateSelected
    });


    var nm = picker.nextMonth;
    picker.nextMonth = function(){
        var m = this.calendars[0].month;
        var y = this.calendars[0].year;
        var d = new Date();
        d.setDate(1);
        d.setMonth(m+1);
        d.setYear(y);
        nm.call(this);
    };

    var pm = picker.prevMonth;
    picker.prevMonth = function(){
        var m = this.calendars[0].month;
        var y = this.calendars[0].year;
        var d = new Date();
        d.setDate(1);
        d.setMonth(m-1);
        d.setYear(y);
        disabledDates = [];
        loadDisabledDates(formatDate(d));
        pm.call(this);
    };


    var bdPicker = new Pikaday({
        field: document.getElementById('bd'),
        yearRange: [1927, 2000],
        theme: 'triangle-theme',
        format: 'DD/MM/YYYY',
        i18n: i18n,
        firstDay: window.calendarStartsAt || 0,
        // maxDate: new Date(),
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

    var slotRequest;
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
        slotRequest.success(function(daySlots){
            for (var i=0;i<daySlots.length;i++) {
                var title = daySlots[i].start;
                var $a = $('<a />').text(title).addClass('app').attr('href', '#');
                $a.slot = daySlots[i];

                $a.click(function (sl) {
                    return function () {
                        $(this).siblings().remove();
                        selectedSlot = sl;
                        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

                        var str = new Date(sl.start).toLocaleString(locales[lang], options) + " <span class='slot'>" + sl.title + "</span>";
                        $('#app-time span').html(str);
                        showPage(2);
                        return false;
                    };
                }(daySlots[i]));

                $dSlots.append($a);
            }
            $slots.append($dSlots);

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
            title: $('#details .title input').val(),
            fname: $('#details .fname input').val(),
            lname: $('#details .lname input').val(),
            phone: $("#phone").intlTelInput("getNumber"),
            email: $('#details .email input').val(),
            birthday: $('#bd').val(),
            lang: lang,
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
                console.log('Caching schedule ...');
                $.get(appUrl + '?date=' + d + '&feature=cache').done(function (data) {
                    console.log('Cached', data);
                });

                console.log('Caching month availability ...');
                $.get(appUrl + '?date=' + d + '&feature=cacheMonthAvail').done(function (data) {
                    console.log('Cached', data);
                });

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
