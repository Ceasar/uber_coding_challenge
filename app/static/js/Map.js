define(function () {

    var makeMap = function() {
        var mapOptions = {
            zoom: 16,
        };
        var gmap = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
        return new Map(gmap);
    }

    var Map = function(map) {
        this.map = map;
        this.parkingSpots = [];
        this.routes = [];
        this.startLocation = null;

        /*
         * Resize the bounds of `map` to include each of `targets`.
         */
        var getBounds = function(targets) {
            var bounds = _.foldl(targets, function(bounds, spot) {
                return bounds.extend(spot.latLng);
            }, new google.maps.LatLngBounds());
            return bounds;
        }
    }

    Map.prototype.addRoute = function(route) {
        route.setMap(this.map);
        route.subscribe(this);
        this.routes.push(route);
    }

    Map.prototype.getCenter = function() {
        return this.map.getCenter();
    }

    Map.prototype.setCenter = function(center) {
        this.map.setCenter(center);
    }

    Map.prototype.getStartLocation = function(center) {
        return this.startLocation;
    }

    Map.prototype.setStartLocation = function(center) {
        if (!center.equals(this.getStartLocation())) {
            this.startLocation = center;
            this.draw();
        }
    }

    Map.prototype.draw = function() {
        var that = this;
        _.each(this.parkingSpots, function(spot) {
            spot.clear();
        });
        getNearbyParkingSpots(this.startLocation, function(spots) {
            that.parkingSpots = spots;
            _.each(that.parkingSpots, function(spot) {
                spot.draw(that.map);
            });
            _.each(that.routes, function(route) {
                route.calculateDirections(that.startLocation, that.parkingSpots, function() {});
            });
        });
    }

    Map.prototype.notify = function(event_name, data) {
        if (event_name == 'start_location_changed' ) {
            this.setStartLocation(data.start_location);
        }
    }

    /*
     * Get a set of parking spots nearby `latLng`.
     */
    function getNearbyParkingSpots(latLng, success) {
        $.getJSON("/closest", {
            latitude: latLng.lat(),
            longitude: latLng.lng(),
        }, function(parkingSpots) {
            success(_.map(parkingSpots, function(spot) {
                return new ParkingSpot(spot);
            }))
        });
    }

    var ParkingSpot = function(spot) {
        this.latLng = new google.maps.LatLng(
            spot.latitude,
            spot.longitude
        );
        var marker;

        this.draw = function(map) {
            if (typeof marker === "undefined") {
                marker = new google.maps.Marker({
                    map: map,
                    // todo: this is redundant
                    position: new google.maps.LatLng(
                        spot.latitude,
                        spot.longitude
                    ),
                    title: spot['location'],
                });
            }
            return marker;
        }

        this.clear = function() {
            marker.setMap(null);
        }
    }

    return {
        makeMap: makeMap,
    };
});
