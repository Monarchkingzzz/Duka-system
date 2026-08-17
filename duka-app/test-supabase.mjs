import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dwkspktsuyfipkziiind.supabase.co";
const supabaseAnonKey = "sb_publishable_SXXMk0Nthl_H06kFyLHZjw_Ng3D466f";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from("products").select("*");
  console.log("Select result - data:", data, "error:", error);

  const testProduct = {
    name: "Test Connection",
    category: "Other",
    buy_price: 10,
    sell_price: 20,
    min_stock: 5
  };
  const insertRes = await supabase.from("products").insert(testProduct).select();
  console.log("Insert result - data:", insertRes.data, "error:", insertRes.error);
}

test();
