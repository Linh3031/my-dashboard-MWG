<script>
  // === START: THAY ĐỔI ===
  // Đã XÓA: import { createEventDispatcher } from 'svelte';
  // Đã XÓA: const dispatch = createEventDispatcher();

  // Biến này sẽ được điều khiển từ file main.js
  export let isVisible = false;
  
  // Hàm này sẽ được truyền TỪ main.js VÀO
  export let onConfirm = () => {};
  export let onClose = () => {};
  // === END: THAY ĐỔI ===

  let password = '';
  let showError = false;

  // --- Đây là logic xử lý của riêng component này ---

  function handleLogin() {
    // Chúng ta lấy mật khẩu admin từ file config
    if (password === 'Linh3031') { 
      showError = false;
      // === START: THAY ĐỔI ===
      onConfirm(); // Gọi thẳng hàm đã được truyền vào
      // Đã XÓA: dispatch('loginSuccess');
      // === END: THAY ĐỔI ===
    } else {
      showError = true;
    }
  }

  function handleCancel() {
    showError = false;
    password = '';
    // === START: THAY ĐỔI ===
    onClose(); // Gọi thẳng hàm đã được truyền vào
    // Đã XÓA: dispatch('close');
    // === END: THAY ĐỔI ===
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
      <h3 class="text-lg font-bold mb-4">Truy cập khu vực Admin</h3>
      <p class="text-sm text-gray-600 mb-4">Vui lòng nhập mật khẩu để xem và chỉnh sửa phần Khai báo.</p>
      
      <input 
        type="password" 
        class="w-full p-2 border rounded-lg mb-2" 
        placeholder="Mật khẩu..."
        bind:value={password}
        on:keydown={(e) => e.key === 'Enter' && handleLogin()}
      >
      
      {#if showError}
        <p class="text-red-500 text-sm mb-4">Mật khẩu không đúng. Vui lòng thử lại.</p>
      {/if}
      
      <div class="flex justify-end space-x-3">
        <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" on:click={handleCancel}>
          Hủy
        </button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" on:click={handleLogin}>
          Xác nhận
        </button>
      </div>
    </div>
  </div>
{/if}
<style>
  /* Bạn có thể thêm các style tùy chỉnh ở đây nếu cần */
</style>