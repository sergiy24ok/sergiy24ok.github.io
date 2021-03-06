
var RooundDatePicker = (function ($) {
    
    // lookup array of date objects for given date
    function includesDate(arr, needle) {
      for(var i=0; i < arr.length; i++){
        if( arr[i].toString() == needle.toString() ){
          return true;
        }
      }
      return false;
    }

    function includesDate(arr, needle) {
        var d1, d2;
        d1 = needle.toLocaleDateString("en-US", {day: "2-digit",month: "2-digit",  year: "numeric"});
        
        for(var i=0; i < arr.length; i++){
            d2 = arr[i].toLocaleDateString("en-US", {day: "2-digit",month: "2-digit",  year: "numeric"});

            if( d1 == d2 ){
                return true;
            }
        }
        return false;
    }

    // returns array of dates between two given dates, including these two
    function getDatesRange(date1, date2) {
        if ('string' == typeof date1) {
            date1 = new Date(date1);
        }

        if ('string' == typeof date2) {
            date1 = new Date(date2);
        }

        var fromD, toD;
        if (date1 < date2) {
            fromD = date1;
            toD = date2;
        } else {
            fromD = date2;
            toD = date1;
        }

        var dateArray = [];
        var currentDate = fromD;
        while (currentDate <= toD) {
             dateArray.push( new Date(currentDate) );
             // This works even for the last day of a month (or year), because the JavaScript date object is smart about rollover
             currentDate = currentDate.setDate(currentDate.getDate() + 1);
             // recreate date object, as now currentdate is timestamp
             currentDate = new Date(currentDate);
        }

        return dateArray;
    }

    // Pass either element or selector as first param. For options reference see http://multidatespickr.sourceforge.net 
    function MyDatepicker(el, options) {
        if ('string' == typeof el) {
            el = $(el);
        }

        this.$el = el;
        this.isShift = false;
        this.mouseDown = false;
        this.lastClick = {
            rangeClosed: false
        };

        this.state = [];
        this.dragDate1 = null;
        this.dragDate2 = null;
        this.options = options;

        this.init();
    }

    function readDateFromTD(el) {
        var month = $(el).data('month') + 1;
        var year = $(el).data('year');
        var day = $(el).text();

        month = month.toString().length < 2 ? "0" + month.toString() : month.toString();
        day = day.length < 2 ? "0" + day : day;
        year = year.toString();

        var date = month + "/" + day + "/" + year;

        return date;
    }

    MyDatepicker.prototype.getState = function(){
        var state = this.$el.multiDatesPicker('getDates');
        var i;
        for (i = 0; i < state.length; i++) {
            state[i] = new Date(state[i]);
        }

        return state;
    }

    MyDatepicker.prototype.init = function(){
        var self = this;

        $(document).keydown(function (e) {
            if (e.keyCode == 16) {
                self.isShift = true;
            }
        });

        $(document).keyup(function (e) {
            if (e.keyCode == 16) {
                self.isShift = false;
            }
        });

        var options = this.options || {};
        $.extend(options, {
            onSelect: function(date, dateObj){

                var state = self.getState();

                date = new Date(date);
                
                var dateAdded = false;
                if (includesDate(state, date)) {
                    dateAdded = true;
                }

                var range;

                // this indicates whether current click created range (either selected dates or removed)
                var rangeClosed = false;

                // if previous click added date and shift is pressed: add range
                if (self.lastClick.added && self.isShift && !self.lastClick.rangeClosed && self.lastClick.date && self.lastClick.date.toString() != date.toString()) {
                    range = getDatesRange(self.lastClick.date, date);

                    self.$el.multiDatesPicker('addDates', range);
                    rangeClosed = true;
                }

                // if previous click removed date and shift is pressed: remove range (if all dates between selected)
                if (!self.lastClick.added && self.isShift && !self.lastClick.rangeClosed && self.lastClick.date && self.lastClick.date.toString() != date.toString()) {

                    range = getDatesRange(self.lastClick.date, date);
                    range.pop();
                    range.shift();

                    function isSelected(element, index, array) {
                        return includesDate(state, element);
                    }

                    var doRemoveRange = range.every(isSelected);

                    if (doRemoveRange) {
                        self.$el.multiDatesPicker('removeDates', range);
                        rangeClosed = true;
                    }
                    
                }
                

                self.lastClick.date = date;
                self.lastClick.added = dateAdded;
                self.lastClick.rangeClosed = rangeClosed;
            }
        });
        
        this.$el.multiDatesPicker(options);

        // Hide emty artefact div
        $('#ui-datepicker-div').css('display', 'none');

        this.$el.on('mousedown touchstart', 'td', function(e){
            // http://www.quirksmode.org/js/events_properties.html#link6
            var rightclick;
            if (!e) var e = window.event;
            if (e.which) rightclick = (e.which == 3);
            else if (e.button) rightclick = (e.button == 2);
            if (rightclick) {
                return false;
            }

            self.mouseDown = true;
            var date1 = readDateFromTD(this);
            self.dragDate1 = new Date(date1);

            return false;
        });

        this.$el.on('mouseover', 'td', function(){
            if (self.mouseDown) {
                var date2 = readDateFromTD(this);
                self.dragDate2 = new Date(date2);
                
                var dragRange = getDatesRange(new Date(self.dragDate1), new Date(self.dragDate2));
                self.$el.find('.pre-selected').removeClass('pre-selected');
                
                $.each(dragRange, function(i, el){
                    var day = el.getDate();
                    var month = el.getMonth();
                    var year = el.getFullYear();

                    $('td[data-year="'+year+'"][data-month="'+month+'"]').filter(function(){
                        return $('a', this).text() == day;
                    }).addClass('pre-selected');
                });
            }
        });

        this.$el.on('touchmove', function(event){
            if (self.mouseDown) {

                // http://stackoverflow.com/a/33464547/1660185
                var myLocation = event.originalEvent.changedTouches[0];
                var realTarget = document.elementFromPoint(myLocation.clientX, myLocation.clientY);
                
                var $el;
                if ($(realTarget).is('td[data-year]')) {
                    $el = $(realTarget); 
                } else {
                    $el = $(realTarget).parents('td[data-year]');
                    if ($el.length) {
                        $el = $el[0];
                    } else {
                        return;
                    }
                }

                var date2 = readDateFromTD($el);
                self.dragDate2 = new Date(date2);
                
                var dragRange = getDatesRange(new Date(self.dragDate1), new Date(self.dragDate2));
                self.$el.find('.pre-selected').removeClass('pre-selected');
                
                $.each(dragRange, function(i, el){
                    var day = el.getDate();
                    var month = el.getMonth();
                    var year = el.getFullYear();

                    $('td[data-year="'+year+'"][data-month="'+month+'"]').filter(function(){
                        return $('a', this).text() == day;
                    }).addClass('pre-selected');
                });

            }
        });

        $(document).on('mouseup touchend', function(){
            self.mouseDown = false;
            if (self.dragDate1 && self.dragDate2) {
                var range = getDatesRange(self.dragDate1, self.dragDate2);
                self.dragDate1 = self.dragDate2 = null;

                var state = self.getState();
                var isAddRange = range.some(function(el, index, arr){
                    return !includesDate(state, el);
                });

                var action = isAddRange ? 'addDates' : 'removeDates';

                self.$el.multiDatesPicker(action, range);
            }
        });
    }

    MyDatepicker.prototype.getDates = function() {
        return this.$el.multiDatesPicker('getDates');
    }

    MyDatepicker.prototype.getEl = function() {
        return this.$el;
    }

    MyDatepicker.prototype.numberOfMonths = function(param){
        var dates = this.getDates();
        
        if (this.options.hasOwnProperty('numberOfMonths')) {

            // do not refresh if numberOfMunths did not change
            if (Number.isInteger(this.options.numberOfMonths) && Number.isInteger(param) && this.options.numberOfMonths == param) {
                return;
            }
            if (Array.isArray(this.options.numberOfMonths) && Array.isArray(param) && this.options.numberOfMonths[0] == param[0] && this.options.numberOfMonths[1] == param[1]) {
                return;
            }

            delete this.options.numberOfMonths;
        } else if (!param) {
            return;
        }

        if (Array.isArray(param) && 2 == param.length) {
            this.options.numberOfMonths = param;
        }

        if (Number.isInteger(param) && param >= 1 && param <=12) {
            this.options.numberOfMonths = param;
        }

        this.$el.multiDatesPicker('destroy');
        this.$el.multiDatesPicker(this.options);

        this.$el.multiDatesPicker('resetDates');

        if (dates.length) {
            this.$el.multiDatesPicker('addDates', dates);
        }
    }    

    return MyDatepicker;
}(jQuery));