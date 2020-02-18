<template>
  <div id="app">
    <div class="wrap">
      <div class="wrap_toolbox">
        <div class="toolbox_select">
          <select v-model="selected.city.id" @change="changeCity">
            <option
              v-for="(item, index) in cityData"
              v-bind:value="index"
              :key="index"
            >{{ item.CityName }}</option>
          </select>
          <select v-model="selected.village.id" @change="changeVill">
            <option disabled value="99999">--選擇鄉鎮區--</option>
            <option v-for="(item,index) in villdata" :value="index" :key="index">{{item.AreaName}}</option>
          </select>
        </div>
        <div class="toolbox_pharmacy">
          <div
            @click="click_pharmacy_box(item,index)"
            class="pharmacy_box"
            v-for="(item, index) in selected.data"
            :key="index"
          >
            <h1 class="pharmacy_name">{{item.properties.name}}</h1>
            <p class="address">
              地址:
              <a
                :href="`https://www.google.com.tw/maps/place/${item.properties.address}`"
                target="_blank"
              >{{item.properties.address}}</a>
            </p>
            <button
              class="adult"
              :class="{'noMasks':item.properties.mask_adult ==0}"
              disabled="disabled"
            >成人口罩 : {{item.properties.mask_adult}}</button>
            <button
              class="child"
              :class="{'noMasks':item.properties.mask_child ==0}"
              disabled="disabled"
            >兒童口罩 : {{item.properties.mask_child}}</button>
          </div>
          <!-- <div class="pharmacy_box">
            <h1 class="pharmacy_name">範例藥局</h1>
            <p class="address">地址:</p>
            <button class="adult noMasks" disabled="disabled">成人口罩 : 0</button>
            <button class="child" disabled="disabled">兒童口罩 : 20</button>
          </div>-->
        </div>
      </div>
      <div class="wrap_map" id="map"></div>
    </div>
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import data from "@/city_data/CityCountyData.json";

export default {
  name: "App",
  data() {
    return {
      map: null,
      greenIcon: null,
      greyIcon: null,
      cityData: data,
      villdata: [],
      masksData: [],
      markerGroup: [],
      firstGroup: false,
      selected: {
        city: {
          name: "臺北市",
          id: 0
        },
        village: {
          name: "中正區",
          id: 0
        },
        data: []
      }
    };
  },
  mounted() {
    this.map = L.map("map", {
      center: [25.03, 121.55],
      zoom: 14
    });

    this.greenIcon = new L.Icon({
      iconUrl:
        "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.greyIcon = new L.Icon({
      iconUrl:
        "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    const vm = this;
    //MASKSAPI
    this.$http
      .get(
        "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json"
      )
      .then(response => {
        this.masksData = response.data.features;
        // console.log(this.cityData);
        this.getVilldata();
        this.changeVill();
      });
  },
  methods: {
    changeCity() {
      let vm = this;
      vm.selected.city.name = vm.cityData[vm.selected.city.id].CityName;
      vm.selected.village = {
        id: 99999, //預設值value
        name: ""
      };
      vm.getVilldata();
      vm.selected.data = vm.masksData.filter(
        item => vm.selected.city.name == item.properties.county
      );
    },
    changeVill() {
      let vm = this;
      vm.selected.village.name = vm.villdata[vm.selected.village.id].AreaName;
      vm.selected.data = vm.masksData.filter(
        item =>
          vm.selected.village.name == item.properties.town &&
          vm.selected.city.name == item.properties.county
      );
      vm.setCenter();
      vm.updataMarkers();
    },
    getVilldata() {
      let vm = this;
      vm.villdata = vm.cityData[vm.selected.city.id].AreaList;
    },
    setCenter() {
      let vm = this;
      if (vm.selected.data.length > 0) {
        let x = vm.selected.data[0].geometry.coordinates[1];
        let y = vm.selected.data[0].geometry.coordinates[0];
        vm.map.setView([x, y], 14);
      }
    },
    updataMarkers() {
      let vm = this;
      let temp = [];
      // vm.firstGroup ? vm.markerGroup.clearLayers() : vm.firstGroup = true;
      if (vm.markerGroup.length > 0) {
        vm.markerGroup.forEach((item, index) =>
          vm.map.removeLayer(vm.markerGroup[index])
        );
        vm.markerGroup = [];
      }
      vm.selected.data.forEach((item, index) => {
        let x = item.geometry.coordinates[1];
        let y = item.geometry.coordinates[0];
        if (
          item.properties.mask_adult == 0 &&
          item.properties.mask_child == 0
        ) {
          vm.markerGroup.push(new L.marker([x, y], { icon: vm.greyIcon }));
        } else {
          vm.markerGroup.push(new L.marker([x, y], { icon: vm.greenIcon }));
        }

        vm.markerGroup[index].addTo(vm.map).bindPopup(
          `<strong>${item.properties.name}</strong>
            <p style='margin: 5px 0;'>地址:${item.properties.address}</P>
            <h3>成人口罩:${item.properties.mask_adult} | 兒童口罩:${item.properties.mask_child}</h3>
            `
        );
      });
      // console.log(vm.markerGroup[0]);
    },
    click_pharmacy_box(item, index) {
      // console.log(item)
      const vm = this;
      vm.map.panTo([
        item.geometry.coordinates[1],
        item.geometry.coordinates[0]
      ]);
      vm.markerGroup[index].openPopup();
    }
  }
};
</script>



<style scope lang="scss">
@import url("https://fonts.googleapis.com/css?family=Noto+Sans+TC:100,300,400,500,700&display=swap&subset=chinese-traditional");

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
  height: 100vh;
}
#app,
select,
button,
strong {
  font-family: "Noto Sans TC", sans-serif, Microsoft JhengHei;
  font-size: 24px;
  color: #000;
}
.address {
  font-family: "Noto Sans TC", sans-serif, Microsoft JhengHei;
  margin: 10px 0;
}
h3 {
  font-family: "Noto Sans TC", sans-serif, Microsoft JhengHei;
  font-size: 18px;
}
.wrap {
  display: flex;
  height: 100vh;
  .wrap_toolbox {
    width: 400px;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    .toolbox_select {
      position: sticky;
      top: 0;
      // width: 300px;
      height: 120px;
      display: flex;
      // align-items: center;
      justify-content: center;
      flex-direction: column;
      background: #f3ece6;

      select {
        width: 80%;
        height: 40px;
        // margin-bottom: 30px;
        margin: 10px;
        border: 1px solid #ced4da;
        border-radius: 10px;
        .disabled {
          color: #a9a6a6;
        }
      }
    }
    .toolbox_pharmacy {
      // width: 300px;
      .pharmacy_box {
        height: 100px;
        text-align: left;
        padding: 10px 10px;
        border: 1px solid #d9d0c9;

        &:hover {
          background: #ececec;
          cursor: pointer;
        }
        .pharmacy_name {
          margin-bottom: 10px;
        }
        .address {
          font-size: 16px;
          margin-bottom: 10px;
        }
        button {
          font-size: 20px;
          width: 151px;
          border: 0;
          background: #2196f3;
          &.adult {
            border-radius: 5px 0 0 5px;
            margin-right: 5px;
          }
          &.child {
            border-radius: 0 5px 5px 0;
          }
          &.noMasks {
            background: #ccc5bf;
          }
        }
      }
    }
  }
  .wrap_map {
    width: calc(100vw - 300px);
    height: 100vh;
    background: #2c3e50;
  }
}
</style>
