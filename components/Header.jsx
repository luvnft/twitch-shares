import { View } from "react-native";
import HeaderComponent from "./HeaderComponent";
import { useEffect, useState } from "react";
import supabase from "../config/supabaseConfig";
import socket from "../socket";
import Toast from "react-native-toast-message";

function Header() {
  const [toastQueue, setToastQueue] = useState([]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        
        // Ensure data and data.session exist before accessing user
        if (data && data.session && data.session.user) {
          return data.session.user;
        } else {
          return null;
        }
      } catch (error) {
        // Handle errors or log them
        console.error('Error fetching current user:', error);
        return null;
      }
    };

    fetchCurrentUser().then(user => {
      if (user) {
        socket.emit("register user", user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (toastQueue.length > 0) {
      const toastInfo = toastQueue[0];
      toastInfo.onHide = onToastHide;
      Toast.show(toastInfo);
    }
  }, [toastQueue]);

  const addToastToQueue = (toast, front = false) => {
    setToastQueue(currentQueue => {
      const newQueue = [...currentQueue];
      if (front) {
        newQueue.unshift(toast);
      } else {
        newQueue.push(toast);
      }
      return newQueue;
    });
  };

  const onToastHide = () => {
    setTimeout(function () {
      setToastQueue(currentQueue => {
        const newQueue = [...currentQueue];
        newQueue.shift();
        return newQueue;
      });
    }, 1000);
  };

  useEffect(() => {
    socket.on("update", (newUpdateInfo) => {
      addToastToQueue({
        type: "success",
        text1: `Prices updated!`,
        text2: `Next update at ${new Date(newUpdateInfo.times.nextUpdate).toLocaleTimeString()}`
      }, true);
    });
    socket.on("game_update", (game_info) => {
      addToastToQueue({
        type: "info",
        text1: `Price update for ${game_info.game.name}`,
        text2: `New price: ${game_info.game.viewer_count}`
      });
    });
  }, [socket]);

  return (
    <View style={{ position: "fixed", left: 0, right: 0, top: 0, zIndex: 1 }}>
      <HeaderComponent />
      <Toast />
    </View>
  );
}

export default Header;
