class JohnG {
    /**
     * Creates a new JohnG instance
     * @param  {array} data=[] - An array of data to display
     */
    constructor(
        data = []
    ) {
        this.id = 0;


        this.set = function (data) {
            this.data = this.checkData(data);
        };

        this.add = function (data) {
            this.data.concat(this.checkData(data));
        };

        this.update = function (data) {
            this.data[data.id] = Object.assign(this.data[data.id], data);
        };

        this.checkData = function (data) {
            var dataHoldingArray = [];
            if (Array.isArray(data)) {
                var arrayLength = data.length;
                for (var i = 0; i < arrayLength; i++) {
                    var thisItem = data[i];
                    if (('start' in thisItem)) {
                        if (!('id' in thisItem)) {
                            thisItem["id"] = this.uniqueId();
                        }
                        if (!('end' in thisItem)) {
                            thisItem["end"] = this.discard + thisItem["start"];
                        }
                        dataHoldingArray.push(thisItem);
                    } else {
                        console.log(`Data item is missing start and end property, item: ${JSON.stringify(thisItem)}`);
                    }
                }
            }
            return dataHoldingArray;
        };

        this.get = function () {
            return this.data.filter(
                (item) => item.start <= this.count && this.count <= item.end
            );
        };

        this.between = function (breakStart, breakEnd) {
            return this.data.filter(
                (item) =>
                    parseInt(breakStart, 10) <= item.start &&
                    item.end <= parseInt(breakEnd, 10)
            );
        };

        this.all = function () {
            return this.data;
        };

        this.uniqueId = function () {
            return this.id++ + '';
        }
    }
};
