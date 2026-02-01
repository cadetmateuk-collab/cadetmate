import { CadetMateSidebar } from "../components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full">
      <CadetMateSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold">Welcome</h1>
        {/* Your page content here */}
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
<stripe-pricing-table pricing-table-id="prctbl_1SkSReRwygITQzeHqWUlfbRI"
publishable-key="pk_test_51S8R2vRwygITQzeHn6B8EW7O3AmdwJHQBknayUD9sO2o7byW50Cp3uuxFL4VW9HDykuCjtdV0D2xoWj3jk8wZFAo0025ArN1iY">
</stripe-pricing-table>
      </main>
    </div>
  );
}
