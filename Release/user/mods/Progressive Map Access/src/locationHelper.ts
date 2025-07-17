/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export class LocationHelpers
{
    public groundZero;
    public groundZeroHigh;
    public customs;
    public factoryDay;
    public factoryNight;
    public woods;
    public interChange;
    public streets;
    public shoreLine;
    public lightHouse;
    public reserve;
    public labs;

    public locationsArray: string[] =
        [
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
        ]

    public groundZeroAdjacent: any[] = []

    public streetsAdjacent: string[] = []

    public interChangeAdjacent: string[] = []

    public customsAdjacent: string[] = []

    public factoryAdjacent: string[] = []
    
    public woodsAdjacent: string[] = []

    public labsAdjacent: string[] = []

    public lightHouseAdjacent: string[] = []

    public reserveAdjacent: string[] = []

    public shoreLineAdjacent: string[] = []

    public initializeArrays()
    {
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