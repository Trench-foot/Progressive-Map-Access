"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationHelpers = void 0;
class LocationHelpers {
    groundZero;
    groundZeroHigh;
    customs;
    factoryDay;
    factoryNight;
    woods;
    interChange;
    streets;
    shoreLine;
    lightHouse;
    reserve;
    labs;
    locationsArray = [
        "Sandbox",
        "Sandbox_high",
        "bigmap",
        "factory4_day",
        "factory4_night",
        "Woods",
        "Interchange",
        "Shoreline",
        "RezervBase",
        "Lighthouse",
        "TarkovStreets",
        "laboratory",
        "develop"
    ];
    groundZeroAdjacent = [];
    streetsAdjacent = [];
    interChangeAdjacent = [];
    customsAdjacent = [];
    factoryAdjacent = [];
    woodsAdjacent = [];
    labsAdjacent = [];
    lightHouseAdjacent = [];
    reserveAdjacent = [];
    shoreLineAdjacent = [];
    initializeArrays() {
        this.groundZeroAdjacent.push(this.streets);
        this.streetsAdjacent.push(this.groundZero, this.groundZeroHigh, this.interChange, this.labs);
        this.interChangeAdjacent.push(this.customs, this.streets);
        this.customsAdjacent.push(this.factoryDay, this.factoryNight, this.interChange, this.reserve);
        this.factoryAdjacent.push(this.customs, this.woods, this.labs);
        this.woodsAdjacent.push(this.factoryDay, this.factoryNight, this.reserve, this.lightHouse);
        this.labsAdjacent.push(this.factoryDay, this.factoryNight, this.streets);
        this.lightHouseAdjacent.push(this.woods, this.shoreLine, this.reserve);
        this.reserveAdjacent.push(this.customs, this.woods, this.lightHouse);
        this.shoreLineAdjacent.push(this.lightHouse);
    }
}
exports.LocationHelpers = LocationHelpers;
//# sourceMappingURL=locationHelper.js.map