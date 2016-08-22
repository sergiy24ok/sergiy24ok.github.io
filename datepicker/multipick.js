$(document).ready(function(){
    
    // lookup array of date objects for given date
    function includesDate(arr, needle) {
      for(var i=0; i < arr.length; i++){
        if( arr[i].toString() == needle.toString() ){
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

    // Pass either element or selector.
    function MyDatepicker(el, options) {
        if ('string' == typeof el) {
            el = $(el);
        }

        this.$el = el;
        this.isShift = false;
        this.lastClick = {
            rangeClosed: false
        };

        this.state = [];
        this.dragDate1 = null;
        this.options = options;

        this.init();
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
                console.log('onSelect')

                // state of datepicker: array of all dates selected
                var state = $(this).multiDatesPicker('getDates');
                var i;
                for (i = 0; i < state.length; i++) {
                    state[i] = new Date(state[i]);
                }
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

        $('#ui-datepicker-div').css('display', 'none');

        // drag select init

        function dragstart( ev, dd ){
            var month = $(this).data('month') + 1;
            var year = $(this).data('year');
            var day = $(this).text();

            month = month.toString().length < 2 ? "0" + month.toString() : month.toString();
            day = day.length < 2 ? "0" + day : day;
            year = year.toString();

            var date1 = month + "/" + day + "/" + year;

            self.dragDate1 = new Date(date1);
            console.log(date1);

            return $('<div class="selection" />')
                .css('opacity', .65 )
                .appendTo( document.body );
        }

        function drag( ev, dd ){
            $( dd.proxy ).css({
                top: Math.min( ev.pageY, dd.startY ),
                left: Math.min( ev.pageX, dd.startX ),
                height: Math.abs( ev.pageY - dd.startY ),
                width: Math.abs( ev.pageX - dd.startX )
            });
        }

        function dragend( ev, dd ){
            $( dd.proxy ).remove();
        }

        function dropstart(){
            $( this ).addClass("selected");
        }

        function drop( ev, dd ){
            var month = $(this).data('month') + 1;
            var year = $(this).data('year');
            var day = $(this).text();

            month = month.toString().length < 2 ? "0" + month.toString() : month.toString();
            day = day.length < 2 ? "0" + day : day;
            year = year.toString();

            var date2 = month + "/" + day + "/" + year;
            console.log(date2);

            var date1 = new Date(self.dragDate1);
            date2 = new Date(date2);

            var range = getDatesRange(date1, date2);
            self.$el.multiDatesPicker('addDates', range);

        }

        function dropend(){
            $( this ).removeClass("selected");
        }

        // delegated events: dragend, drop, dropend doesn't work for some reason (???)
        // this.$el
        // .on('dragstart', 'td[data-year]', dragstart)
        // .on('drag', 'td[data-year]', drag)
        // .on("dragend", 'td[data-year]', dragend);

        // this.$el.on("dropstart", 'td[data-year]', dropstart)
        // .on('drop', 'td[data-year]', drop)
        // .on("dropend", 'td[data-year]', dropend);

        $('td[data-year]').drag(drag).drag('start', dragstart).drag('end', dragend);
        $('td[data-year]').drop(drop).drop('start', dropstart).drop('end', dropend);

        $.drop({ multi: true, mode: "pointer" });
    }

    MyDatepicker.prototype.getDates = function() {
        return this.$el.multiDatesPicker('getDates');
    }

    MyDatepicker.prototype.getEl = function() {
        return this.$el;
    }    


    window.picker = new MyDatepicker('#datepicker', {numberOfMonths: [1, 3]});
    


});