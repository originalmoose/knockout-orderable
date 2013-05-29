ko.bindingHandlers.orderable = {
    getProperty: function(o, s) {
        // copied from http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
        s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, '');           // strip a leading dot
        var a = s.split('.');
        while (a.length) {
            var n = a.shift();
            if (n in o) {
                o = o[n];
            } else {
                return;
            }
        }
        return o;
    },
    
    getCollection: function (viewModel, collection) {
        var r = viewModel;
        var a = collection.split('.');
        while (a.length) {
            var n = a.shift();
            if (n.indexOf('()') >= 0) {
                r = r[n.replace('()', '')]();
            } else {
                r = r[n];
            }
        }
        return r;
    },

    compare: function (left, right) {
        if (typeof left === 'string' || typeof right === 'string') {
            return left.localeCompare(right);
        }
        if (left > right)
            return 1;

        return left < right ? -1 : 0;
    },

    sort: function (viewModel, collection, field) {
        var item = ko.bindingHandlers.orderable.getCollection(viewModel, collection);
        //make sure we sort only once and not for every binding set on table header
        if (item.orderField() == field) {
            item.sort(function (left, right) {
                var left_field = ko.bindingHandlers.orderable.getProperty(left, field);
                var right_field = ko.bindingHandlers.orderable.getProperty(right, field);
                var left_val  = (typeof  left_field === 'function') ?  left_field() :  left_field;
                    right_val = (typeof right_field === 'function') ? right_field() : right_field;
                    if (item.orderDirection() == "desc") {
                    return ko.bindingHandlers.orderable.compare(right_val, left_val);
                } else {
                    return ko.bindingHandlers.orderable.compare(left_val, right_val);
                }
            });
        }
    },

    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        //get provided options
        var collection = valueAccessor().collection;
        var field = valueAccessor().field;
        var item = ko.bindingHandlers.orderable.getCollection(viewModel, collection);
        //add a few observables to ViewModel to track order field and direction
        if (item.orderField == undefined) {
            item.orderField = ko.observable();
        }
        if (item.orderDirection == undefined) {
            item.orderDirection = ko.observable("asc");
        }

        var defaultField = valueAccessor().defaultField;
        var defaultDirection = valueAccessor().defaultDirection || "asc";
        if (defaultField) {
            item.orderField(field);            
            item.orderDirection(defaultDirection);
            ko.bindingHandlers.orderable.sort(viewModel, collection, field);
        }

        //set order observables on table header click
        $(element).click(function (e) {
            e.preventDefault();
            
            //flip sort direction if current sort field is clicked again
            if (item.orderField() == field) {
                if (item.orderDirection() == "asc") {
                    item.orderDirection("desc");
                } else {
                    item.orderDirection("asc");
                }
            }
            
            item.orderField(field);
        });

        //order records when observables changes, so ordering can be changed programmatically
        item.orderField.subscribe(function () {
            ko.bindingHandlers.orderable.sort(viewModel, collection, field);
        });
        item.orderDirection.subscribe(function () {
            ko.bindingHandlers.orderable.sort(viewModel, collection, field);
        });
    },

    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        //get provided options
        var collection = valueAccessor().collection;
        var field = valueAccessor().field;
    	var item = ko.bindingHandlers.orderable.getCollection(viewModel, collection);
		
        var isOrderedByThisField = item.orderField() == field;
            
        //apply css binding programmatically
        ko.bindingHandlers.css.update(
            element,
            function () {
                return {
                    sorted: isOrderedByThisField,
                    asc: isOrderedByThisField && item.orderDirection() == "asc",
                    desc: isOrderedByThisField && item.orderDirection() == "desc"
                };
            },
            allBindingsAccessor,
            viewModel,
            bindingContext
        );
    }
};
