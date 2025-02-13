import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  View,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  Dimensions,
  ImageBackground,ScrollView,
  StyleSheet
} from "react-native";
import { Avatar } from "react-native-elements";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";



const app = "123";


interface ChatMessage {
  sender: "user" | "bot";
  message: string;
  theme: string;
}

interface Chat {
  title: string;
  messages: ChatMessage[];
  theme: string; // Menambahkan properti theme
}

// Menentukan gambar latar belakang berdasarkan tema dan mode
const getBackgroundForTheme = (
  theme: "royal" | "berani" | "default",
  isDarkMode: boolean
) => {
  switch (theme) {
    case "royal":
      return isDarkMode
        ? require("./icon/malam.jpeg")
        : require("./icon/kerajaan_ku.jpeg");
    case "berani":
      return isDarkMode
        ? require("./icon/keberanian_gelap.jpeg")
        : require("./icon/keberanian_terang.jpeg");
    

    default:
      return isDarkMode;
  }
};

// Menentukan avatar berdasarkan tema dan mode
// const getAvatarForTheme = (theme: "royal" | "youth" | "default", isDarkMode: boolean) => {
//   switch (theme) {
//     case "royal":
//       return isDarkMode
//         ? require("./assets/royal_character_dark.png")
//         : require("./assets/royal_character_light.png");
//     case "youth":
//       return isDarkMode
//         ? require("./assets/youth_character_dark.png")
//         : require("./assets/youth_character_light.png");
//     default:
//       return isDarkMode
//         ? require("./assets/default_character_dark.png")
//         : require("./assets/default_character_light.png");
//   }
// };

const App = () => {
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [savedChats, setSavedChats] = useState<Chat[]>([]);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [chatTitle, setChatTitle] = useState<string>("");
  const [showSavedChats, setShowSavedChats] = useState<boolean>(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatThame, setChatThame] = useState<string>("");
  const theme: "default" | "royal" | "berani"  =
    (chatHistory[0]?.theme as "default" | "royal" | "berani") ||
    "default";

  const deviceTheme = useColorScheme();

  const screenheight = Dimensions.get("screen").height;
  const marginToppersentase = 0.01;

  useEffect(() => {
    setIsDarkTheme(deviceTheme === "dark");
  }, [deviceTheme]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDarkTheme ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [isDarkTheme]);

  const backgroundColorInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["white", "black"],
  });

  const loadChatHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("chatHistory");
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const loadSavedChats = async () => {
    try {
      const savedChats = await AsyncStorage.getItem("savedChats");
      if (savedChats) {
        setSavedChats(JSON.parse(savedChats));
      }
    } catch (error) {
      console.error("Failed to load saved chats:", error);
    }
  };

  const saveChatHistory = async (history: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem("chatHistory", JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  };

  const saveChat = async () => {
    if (!chatTitle.trim()) return;

    const newChat: Chat = {
      title: chatTitle.trim(),
      messages: chatHistory,
      theme: chatThame.trim(),
    };

    const updatedSavedChats = [...savedChats, newChat];
    setSavedChats(updatedSavedChats);
    await AsyncStorage.setItem("savedChats", JSON.stringify(updatedSavedChats));

    setChatTitle("");
    setChatHistory([]);
    setModalVisible(false);
  };

  const loadChat = (chat: Chat) => {
    setChatHistory(chat.messages);
    setSelectedChat(chat);
    setShowSavedChats(false);
  };

  const deleteChat = async (title: string) => {
    const updatedSavedChats = savedChats.filter((chat) => chat.title !== title);
    setSavedChats(updatedSavedChats);
    await AsyncStorage.setItem("savedChats", JSON.stringify(updatedSavedChats));
  };
  const [lastUsedTheme, setLastUsedTheme] = useState<
    "default" | "royal" | "berani"
  >("default");

  const resetChat = async (): Promise<void> => {
    // Simpan tema terakhir sebelum reset
    const previousTheme = chatHistory[0]?.theme as
      | "default"
      | "royal"
      | "berani"
      ;
    setLastUsedTheme(previousTheme || "default");

    setChatHistory([]); 
    await AsyncStorage.removeItem("chatHistory");
  };

  useEffect(() => {
    loadChatHistory();
    loadSavedChats();
  }, []);

  const sendMessage = async (): Promise<void> => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      sender: "user",
      message: message.trim(),
      theme: lastUsedTheme, // Gunakan tema yang disimpan
    };

    const updatedChatHistory = [userMessage, ...chatHistory];
    setChatHistory(updatedChatHistory);
    await saveChatHistory(updatedChatHistory);

    try {
      const response = await axios({
        method: "post",
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          Authorization: `Bearer ${app}`,
          "Content-Type": "application/json",
        },
        data: {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Anda adalah bot yang berbicara dalam bahasa Indonesia serta berpengetahuan banyak mengenai cerita rakyat Indonesia. Respons Anda bisa mempertimbangkan sesuai dengan yang ditanyakan oleh user. Buatlah secara berdialog panjang mengenai tokoh yang ada dalam cerita, buat semenarik mungkin untuk dibaca oleh anak-anak. Miliki emosi dari setiap tokoh yang sesuai.  secara lengkap dan buat ilustrasi tentang ceritanya secara tekstual dan terperinci.",
            },
            { role: "user", content: message.trim() },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        },
      });

      const botResponse = response.data.choices[0].message.content;

      // Tentukan tema berdasarkan respons bot
      let theme: "default" | "royal" | "berani" = "default"; 
      if (botResponse.includes("kerajaan")) theme = "royal";
      if (botResponse.includes("berani")) theme = "berani";
     
      

      const botMessage: ChatMessage = {
        sender: "bot",
        message: botResponse,
        theme: theme, 
      };

      const newChatHistory = [botMessage, ...updatedChatHistory];
      setChatHistory(newChatHistory);
      await saveChatHistory(newChatHistory);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const styles = StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between", // Mengatur posisi kiri-kanan
      alignItems: "center",
      paddingHorizontal: 20,
      marginTop: 30,
    },
    darkModeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    dotsContainer: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      height: 20,
      
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDarkTheme ? "white" : "white",
      marginVertical: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    popup: {
      width: "80%",
      backgroundColor: "white",
      padding: 20,
      borderRadius: 10,
      alignItems: "center",
    },
    text: {
      fontSize: 14,
      color: "black",
      textAlign: "center",
      marginBottom: 20,
    },
    closeButton: {
      backgroundColor: "red",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    closeButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "bold",
    },
  });
  

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const bubbleColor =
      item.sender === "user"
        ? isDarkTheme
          ? "#4A628A"
          : "#4CAF50"
        : isDarkTheme
        ? "#7AB2D3"
        : "#117554";

    const textColor = isDarkTheme ? "white" : "white";

    return (
      <View
  style={{
    flexDirection: "row",
    justifyContent: item.sender === "user" ? "flex-end" : "flex-start",
    marginVertical: 10,
  }}
>
  {item.sender === "bot" && (
    <Avatar
      rounded
      size="small"
      source={require("./icon/bot.png")}
      containerStyle={{ marginRight: 10 }}
    />
  )}
  <View
    style={{
      maxWidth: "75%",
      padding: 10,
      borderRadius: 15,
      backgroundColor: bubbleColor + "88",
      alignSelf: item.sender === "user" ? "flex-end" : "flex-start",
      borderTopRightRadius: item.sender === "user" ? 0 : 15,
      borderTopLeftRadius: item.sender === "user" ? 15 : 0,
      flexShrink: 1, // Tambahkan ini
    }}
  >
    <ScrollView>
      <Text style={{ color: textColor, fontSize: 16 }}>{item.message}</Text>
    </ScrollView>
  </View>
  {item.sender === "user" && (
    <Avatar
      rounded
      size="small"
      source={require("./icon/boy.png")}
      containerStyle={{ marginLeft: 10 }}
    />
  )}
</View>

    );
  };

  const DarkModeToggle = () => {
    return (
      <View style={styles.headerContainer}>
      {/* Dark Mode Toggle */}
      <View style={styles.darkModeContainer}>
        <Text style={{ color: isDarkTheme ? "white" : "white", marginRight: 10 }}>
          Dark Mode
        </Text>
        <TouchableOpacity
          onPress={() => setIsDarkTheme(!isDarkTheme)}
          style={{
            width: 50,
            height: 30,
            borderRadius: 15,
            elevation: 5,
            backgroundColor: isDarkTheme
              ? "rgba(0, 0, 255, 0.8)"
              : "rgba(0, 128, 0, 0.8)",
            justifyContent: "center",
            alignItems: isDarkTheme ? "flex-end" : "flex-start",
            paddingHorizontal: 5,
          }}
        >
          <MaterialCommunityIcons
            name={isDarkTheme ? "moon-waning-crescent" : "white-balance-sunny"}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Titik tiga */}
      <View>
        <TouchableOpacity onPress={toggleModal} style={styles.dotsContainer}>
          <View style={styles.dot}></View>
          <View style={styles.dot}></View>
          <View style={styles.dot}></View>
        </TouchableOpacity>
      </View>

      {/* Popup */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popup}>
            <Text style={styles.text}>
              This work is supported by Bina Nusantara University as a part of
              Bina Nusantara University’s BINUS International Research -
              Applied entitled “Towards Virtual Humans Framework with Emotions
              Model as Indonesian Folklore Storyteller” with contract number:
              069C/VRRTT/III/2024 and contract date: March 18, 2024.
            </Text>
            <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    );
  };

  const renderSavedChat = ({ item }: { item: Chat }) => {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 15,
          backgroundColor: isDarkTheme
            ? "rgba(74, 98, 138, 0.8)"
            : "rgba(240, 240, 240, 0.8)",
          borderRadius: 10,
          marginVertical: 5,
        }}
      >
        <TouchableOpacity onPress={() => loadChat(item)} style={{ flex: 1 }}>
          <Text
            style={{ color: isDarkTheme ? "white" : "black", fontSize: 16 }}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteChat(item.title)}>
          <MaterialCommunityIcons name="trash-can" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Animated.View
  style={{
    flex: 1,
    backgroundColor: backgroundColorInterpolation, // Apply animated background color here
  }}
>
  <ImageBackground
    source={getBackgroundForTheme(theme, isDarkTheme)}
    style={{
      flex: 1,
      width: "100%",
      height: "100%",
    }}
  >
      <View
        style={{
          flex: 1,
          padding: 20, 
          backgroundColor: "rgba(0, 0, 0, 0.5)"        
        }}
      >

        {showSavedChats ? (
          <View>
            <Text
              style={{
                color: isDarkTheme ? "white" : "white",
                fontSize: 20,
                marginTop: 40,
                marginBottom: 40,
              }}
            >
              Saved Chats
            </Text>
            <FlatList
              data={savedChats}
              renderItem={renderSavedChat}
              keyExtractor={(item) => item.title}
            />

            <TouchableOpacity
              onPress={() => setShowSavedChats(false)}
              style={{
                marginTop: screenheight * marginToppersentase,
                padding: 10,
                backgroundColor: isDarkTheme ? "#133E87" : "#117554",
                borderRadius: 5,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>Back to Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <DarkModeToggle />
            <FlatList
              data={chatHistory}
              renderItem={renderMessage}
              keyExtractor={(item, index) => index.toString()}
              inverted
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 0,
                elevation: 2,
                borderRadius: 15,
                padding: 8,
                backgroundColor: isDarkTheme
                  ? "rgba(74, 98, 138, 0.8)"
                  : "rgba(76, 175, 80, 0.8)",
              }}
            >
              <TextInput
                style={{ flex: 1, color: isDarkTheme ? "white" : "white" }}
                placeholder="Type your message..."
                placeholderTextColor={isDarkTheme ? "lightgrey" : "white"}
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity onPress={sendMessage}>
                <View
                  style={{
                    backgroundColor: isDarkTheme
                      ? "rgba(185, 229, 232, 0.8)"
                      : "rgba(192, 235, 166, 0.8)",

                    padding: 10,
                    borderRadius: 10,
                    elevation: 5,
                    shadowColor: "black",
                  }}
                >
                  <Image
                    source={require("./icon/send.png")}
                    style={{ width: 20, height: 20 }}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                marginTop: 20,
                padding: 10,
                backgroundColor: isDarkTheme
                  ? "rgba(19, 62, 135, 0.8)"
                  : "rgba(17, 117, 84, 0.8)",

                borderRadius: 15,
                elevation: 3,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>Save Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSavedChats(true)}
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: isDarkTheme
                  ? "rgba(19, 62, 135, 0.8)"
                  : "rgba(17, 117, 84, 0.8)",

                borderRadius: 15,
                alignItems: "center",
                elevation: 3,
              }}
            >
              <Text
                style={{ color: "white", textAlign: "center", width: "100%" }}
              >
                View Saved Chats
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetChat}
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: isDarkTheme
                  ? "rgba(19, 62, 135, 0.8)"
                  : "rgba(17, 117, 84, 0.8)",

                borderRadius: 15,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "white", textAlign: "center", width: "100%" }}
              >
                Reset Chat
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <View
              style={{
                width: "80%",
                backgroundColor: "white",
                borderRadius: 10,
                padding: 20,
              }}
            >
              <Text style={{ fontSize: 20, marginBottom: 10 }}>Save Chat</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 5,
                  padding: 10,
                }}
                placeholder="Enter chat title"
                value={chatTitle}
                onChangeText={setChatTitle}
              />
              <TouchableOpacity
                onPress={saveChat}
                style={{
                  marginTop: 20,
                  padding: 10,
                  backgroundColor: isDarkTheme ? "#133E87" : "#4CAF50",
                  borderRadius: 5,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white" }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  marginTop: 10,
                  padding: 10,
                  backgroundColor: "#FF6F61",
                  borderRadius: 5,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
    </Animated.View>
  );
};

export default App;
