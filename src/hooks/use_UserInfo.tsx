import { useEffect, useState } from "react";
import { createNewUserInfo } from "../dataStore/user_info_apis";

export default function useUserInfo(email: string) {
  const [returnedEmail, setReturnedEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;

    const run = async () => {
      try {
        const result = await createNewUserInfo(email);
        setReturnedEmail(result.userEmail);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [email]);

  return { returnedEmail, loading };
}