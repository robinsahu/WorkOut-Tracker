"use strict";
class Workout {
    date = new Date();
    id = (Date.now() + "").slice(-10);
    clicks = 0;
    constructor(coords, distance, duration){
        // this.date = ...
        // this.id = ...
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }
    _setDescription() {
        // prettier-ignore
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}
class Running extends Workout {
    type = "running";
    constructor(coords1, distance1, duration1, cadence){
        super(coords1, distance1, duration1);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = "cycling";
    constructor(coords2, distance2, duration2, elevationGain){
        super(coords2, distance2, duration2);
        this.elevationGain = elevationGain;
        // this.type = 'cycling';
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        // km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);
// prettier-ignore
const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
// let map, mapEvent;
class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    constructor(){
        this._getPosition();
        // Get data from local storage
        this._getLocalStorage();
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    }
    _getPosition() {
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
            alert("Could not find the coordinates");
        });
    }
    _loadMap(position) {
        // console.log(position);
        const { latitude  } = position.coords;
        const { longitude  } = position.coords;
        // console.log(latitude, longitude);
        const coords = [
            latitude,
            longitude
        ];
        console.log(this); //undefined so we will use bind in getcurrentposition to loadmap
        this.#map = L.map("map").setView(coords, this.#mapZoomLevel); //map is the idname of div in map function  // L is namespace which have some methods and main function that leaflet gives us as an entry point //first parameter of setview takes array of coordinate //second parameter is zoom level of map
        // console.log(map);
        L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
            //titlelayer basically uses tiles which uses the openstreet map which is an open source map but you can use any other map
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        //handling clicks on map
        this.#map.on("click", this._showForm.bind(this));
        this.#workouts.forEach((work)=>{
            this._renderWorkoutMarker(work);
        });
    }
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }
    _hideForm() {
        // Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(()=>form.style.display = "grid"
        , 1000);
    }
    _newWorkout(e) {
        e.preventDefault();
        const validInputs = (...inputs)=>inputs.every((inp)=>Number.isFinite(inp)
            )
        ;
        const allPositive = (...inputs)=>inputs.every((inp)=>inp > 0
            )
        ;
        //mapEvent is an event coming from leaflet just like e in standard javascript
        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat , lng  } = this.#mapEvent.latlng;
        let workout;
        // If workout running, create running object
        if (type === "running") {
            const cadence = +inputCadence.value;
            // Check if data is valid
            if (// !Number.isFinite(distance) ||
            // !Number.isFinite(duration) ||
            // !Number.isFinite(cadence)
            !validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert("Inputs have to be positive numbers!");
            workout = new Running([
                lat,
                lng
            ], distance, duration, cadence);
        }
        // If workout cycling, create cycling object
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) return alert("Inputs have to be positive numbers!");
            workout = new Cycling([
                lat,
                lng
            ], distance, duration, elevation);
        }
        // Add new object to workout array
        this.#workouts.push(workout);
        // Render workout on map as marker
        this._renderWorkoutMarker(workout);
        //render workout on list
        this._renderWorkout(workout);
        //hide form + clear input fields
        this._hideForm();
        //setting the local storage of workouts
        this._setLocalStorage();
    // console.log(mapEvent);
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords) //take array of coordinates and create the marker
        .addTo(this.#map) //add the marker
        // .bindPopup("Workout") //create a popup and then bind it to popup
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        })).setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`).openPopup();
    }
    _toggleElevationField() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }
    _renderWorkout(workout1) {
        let html = `
      <li class="workout workout--${workout1.type}" data-id="${workout1.id}">
        <h2 class="workout__title">${workout1.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout1.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
          <span class="workout__value">${workout1.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout1.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;
        if (workout1.type === "running") html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout1.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout1.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
        if (workout1.type === "cycling") html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout1.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout1.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
        form.insertAdjacentHTML("afterend", html);
    }
    _moveToPopup(e1) {
        // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
        if (!this.#map) return;
        const workoutEl = e1.target.closest(".workout");
        if (!workoutEl) return;
        const workout = this.#workouts.find((work)=>work.id === workoutEl.dataset.id
        );
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        });
    // using the public interface
    // workout.click();
    }
    _setLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts)); //localStorage is a browser API
    //json.stringify can be used to convert any object into string , "workouts" will be key
    //this API should not be used for large data because it is blocking and will slow down the application
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("workouts"));
        if (!data) return;
        this.#workouts = data;
        this.#workouts.forEach((work)=>{
            this._renderWorkout(work);
        });
    }
    reset() {
        localStorage.removeItem("workouts");
        location.reload(); //location is an object
    // use app.reset in console
    }
}
const app = new App();

//# sourceMappingURL=index.810bb8fa.js.map
