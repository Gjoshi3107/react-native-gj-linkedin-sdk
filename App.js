import React, { Fragment } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Modal,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';

import { WebView } from 'react-native-webview'

const Dimensions = require("Dimensions");
const window = Dimensions.get("window");

let lbody = { "linkedin": "cred" }
let redirectURI = ""
let client_id = ""
let client_secret = ""
let state = Math.round(Math.random() * 10000000000)
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modalLogin: false,
      modalLogOut: false,
      raceCondition: false,
      profileData: [],
      imgsrc: "",
      uri1: "",
      // uri2: ""
    }
  }

  componentDidMount = async () => {
    await fetch("https://snappy.appypie.com/mobileapp/linked-in-credential", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(lbody),
    })
      .then(response => response.json())
      .then((responseJson) => {
        console.log("componentDidMount---" + JSON.stringify(lbody) + "-->" + JSON.stringify(responseJson))
        client_id = responseJson.clientId;
        client_secret = responseJson.clientSecret;
        redirectURI = responseJson.redirectUrl;
      })
      .catch((error) => {
        alert(error.message);
      })
  }

  onNavigationStateChange = async ({ url }: Object) => {
    console.log("url------>" + url)
    const { raceCondition } = this.state
    if (!url.includes("https://www.linkedin.com")) {
      if (url.includes("/index/login-linked-in") && !raceCondition) {
        this.setState({ raceCondition: true, modalLogOut: true }) // modalLogin: false, 
        const codec = url.split("code=");
        const code = codec[1].split("&")

        const state2 = url.split("state=");
        const stateR = state2[1].split("&");

        if (stateR[0] == state) {
          const body = "grant_type=authorization_code&client_id=" + client_id + "&client_secret=" + client_secret + "&code=" + code[0] + "&redirect_uri=" + redirectURI
          console.log("body------>" + body)
          await this.getData(body)
        }
        else {
          alert("Insecure Connection. Please try again later.")
        }
      }
    }
  }

  getData = async (body) => {
    await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body
    })
      .then(response => response.json())
      .then((responseJson) => {
        console.log("responseJson------>" + JSON.stringify(responseJson))
        this.getData2(responseJson.access_token)
      })
      .catch((error) => {
        alert(error.message);
      })
  }

  getData2 = async (token) => {
    console.log("token------>" + token)
    await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Connection": "Keep-Alive"
      },
    })
      .then(response2 => response2.json())
      .then((responseJson1) => {
        console.log("responseJson1------>" + JSON.stringify(responseJson1))
        this.state.profileData.push(responseJson1);
        this.getData3(token)
      })
      .catch((error) => {
        alert(error.message);
      })

  }

  getData3 = async (token) => {
    console.log("token------>" + token)
    await fetch("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Connection": "Keep-Alive"
      },
    })
      .then(response3 => response3.json())
      .then((responseJson2) => {
        console.log("responseJson2------>" + JSON.stringify(responseJson2.elements))
        this.state.profileData[0]["emailAddress"] = responseJson2.elements[0]["handle~"].emailAddress;
        this.setState({ modalLogin: false })
      })
      .catch((error) => {
        alert(error.message);
      })
  }

  onLogOutNavigationStateChange = async ({ url }: Object) => {
    console.log("logout----------->this.modalLogOut.close()--------->url--->" + url)
    if (!url.includes("/m/logout")) {
      this.setState({ modalLogOut: false, raceCondition: false });
      console.log("logout----------->this.modalLogOut.close()")
    }
  }

  signUP() {
    this.setState({
      uri1: "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=" + client_id + "&redirect_uri=" + redirectURI + "&state=" + state + "&scope=r_liteprofile%20r_emailaddress",
      profileData: [],
      modalLogin: true
    })
  }

  render() {
    return (
      <SafeAreaView>
        <StatusBar barStyle="dark-content" />

        <View>
          <TouchableOpacity
            accessibilityComponentType={'button'}
            accessibilityTraits={['button']}
            onPress={() => this.signUP()}//setState({modalLogOut: true})}
          >
            <Text>Login with LinkedIn</Text>
          </TouchableOpacity>
          <Text>The Details are :- {JSON.stringify(this.state.profileData)}</Text>
        </View>

        <Modal
          ref={(c) => this.modalLogin = c}
          visible={this.state.modalLogin}
        >
          <View style={[styles.constainer]}>
            <View style={[styles.wrapper]}>
              <WebView
                source={{ uri: this.state.uri1 }}
                onNavigationStateChange={this.onNavigationStateChange}
              />
              <TouchableOpacity
                onPress={() => this.setState({ modalLogin: false })}
                style={[styles.close]}
              >
                <Image source={require('./assets/x-white.png')} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={this.state.modalLogOut}
        >
          <WebView
            source={{ uri: "https://www.linkedin.com/m/logout" }}
            onNavigationStateChange={this.onLogOutNavigationStateChange}
          />
        </Modal>
        <Modal
          visible={this.state.modalLogOut}
        >
          <View style={[styles.constainer2]}>
            <View style={[styles.wrapper2]}>
              <ActivityIndicator
                animating={true}
                color='#bc2b78'
                size="large"
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 80 }} />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  constainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 40, paddingBottom: 15,
    paddingHorizontal: 10,
  },
  constainer2: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: (0.5 * window.height) - 50,
    paddingHorizontal: (0.5 * window.width) - 50,
    zIndex: 5
  },
  wrapper2: {
    width: 100,
    height: 100,
    borderRadius: 5,
    borderWidth: 10,
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.6)',
  },
  wrapper: {
    flex: 1,
    borderRadius: 5,
    borderWidth: 10,
    borderColor: 'rgba(0, 0, 0, 0.6)',
  },
  close: {
    position: 'absolute',
    top: -17,
    right: -17,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.4)',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
