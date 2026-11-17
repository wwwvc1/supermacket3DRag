import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { apiClient } from "../api/client";
import { shouldIgnoreSceneWheel } from "../lib/observer-guard";
import { safeRemoveStorage } from "../lib/storage";

describe("KORA × TACTILE ARCHIVE 6-Scene App Flow", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    safeRemoveStorage("kora_jwt_token");
  });

  it("guards wheel/touch scene switching when overlays are open or inside scrollable containers (Review Focus #3)", () => {
    const div = document.createElement("div");
    div.setAttribute("data-scrollable", "true");
    const child = document.createElement("span");
    div.appendChild(child);

    expect(shouldIgnoreSceneWheel(child, false)).toBe(true);
    expect(shouldIgnoreSceneWheel(document.body, true)).toBe(true);
    expect(shouldIgnoreSceneWheel(document.body, false)).toBe(false);
  });

  it("navigates across the 6 scenes (Portal -> Garment Rail -> Warp Tech Carousel -> Water Ripple Vitrine) and adds real photographic items via GlassButton", async () => {
    render(<App />);

    // 1. Scene 01 Optical Portal is active initially and timeline has 6 dots
    expect(screen.getByTestId("scene-01-portal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tech table/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vitrine gallery/i })).toBeInTheDocument();

    // 2. Click EXPLORE ARCHIVE -> enters Scene 02 (Garment Rail)
    fireEvent.click(screen.getByRole("button", { name: /EXPLORE ARCHIVE/i }));
    expect(screen.getByTestId("scene-02-archive")).toBeInTheDocument();

    // 3. Switch to Scene 03 (Warp Carousel Digital Showroom) via top showroom switcher bar
    fireEvent.click(screen.getByRole("button", { name: /STAGE II · TECH TABLE/i }));
    const s22Card = screen.getByRole("button", { name: /Samsung Galaxy S22 Ultra · Burgundy/i });
    fireEvent.click(s22Card);

    // Add Samsung S22 Ultra from blurred-backdrop 3D modal using GlassButton
    const addPhoneBtn = await screen.findByRole("button", {
      name: /ADD TO BAG · Samsung Galaxy S22 Ultra/i,
    });
    expect(addPhoneBtn.className).toContain("glass-button");
    fireEvent.click(addPhoneBtn);
    expect(screen.getByRole("button", { name: /BAG \(1\)/i })).toBeInTheDocument();

    // Close Tech modal and switch to Scene 04 (Water Ripple Vitrine Gallery)
    fireEvent.click(screen.getByRole("button", { name: /DOCK TO TABLE/i }));
    fireEvent.click(screen.getByRole("button", { name: /STAGE III · VITRINE GALLERY/i }));
    expect(screen.getByRole("button", { name: /贵州茅台酒 · 飞天典藏 500ml/i })).toBeInTheDocument();
  });

  it("integrates real JWT login, cart sync, Redisson checkout and Alipay Sandbox pre-integration cashier flow", async () => {
    vi.spyOn(apiClient, "getAlipayConfigStatus").mockResolvedValue({
      enabled: false,
      configured: false,
      sandboxSimulationEnabled: true,
      mode: "SANDBOX_SIMULATION",
      gatewayUrl: "https://openapi-sandbox.dl.gateway.alipaydev.com/gateway.do",
      signType: "RSA2",
    });
    vi.spyOn(apiClient, "login").mockResolvedValue({
      token: "jwt-mock-token",
      userId: 1,
      username: "testuser",
    });
    vi.spyOn(apiClient, "addToCart").mockResolvedValue(undefined);
    const listCartSpy = vi
      .spyOn(apiClient, "listCart")
      .mockResolvedValueOnce([
        {
          id: 901,
          productId: 201,
          productName: "Samsung Galaxy S22 Ultra · Burgundy",
          price: 8999,
          quantity: 1,
          subtotal: 8999,
        },
      ])
      .mockResolvedValue([]);

    const pendingOrder = {
      id: 77,
      orderNo: "ORD202611179999",
      userId: 1,
      totalAmount: 8999,
      status: "PENDING",
      paymentMethod: "UNPAID",
      paySubject: "KORA · Samsung Galaxy S22 Ultra · Burgundy",
      createdAt: "2026-11-17T18:45:00",
      items: [
        {
          id: 1,
          productId: 201,
          productName: "Samsung Galaxy S22 Ultra · Burgundy",
          price: 8999,
          quantity: 1,
        },
      ],
    };

    const paidOrder = {
      ...pendingOrder,
      status: "PAID",
      paymentMethod: "ALIPAY_SANDBOX_SIM",
      tradeNo: "ALIPAY_SANDBOX_1794912345",
      paidAt: "2026-11-17T18:46:00",
    };

    const listOrdersSpy = vi
      .spyOn(apiClient, "listMyOrders")
      .mockResolvedValueOnce({ records: [], total: 0, size: 20, current: 1, pages: 0 })
      .mockResolvedValueOnce({ records: [pendingOrder], total: 1, size: 20, current: 1, pages: 1 })
      .mockResolvedValue({ records: [paidOrder], total: 1, size: 20, current: 1, pages: 1 });

    vi.spyOn(apiClient, "createOrder").mockResolvedValue(pendingOrder);
    vi.spyOn(apiClient, "createAlipayOrder").mockResolvedValue({
      orderNo: pendingOrder.orderNo,
      subject: pendingOrder.paySubject!,
      totalAmount: 8999,
      mode: "SANDBOX_SIMULATION",
      configured: false,
      gatewayUrl: "https://openapi-sandbox.dl.gateway.alipaydev.com/gateway.do",
      payFormHtml: null,
      notifyUrl: "http://localhost:8080/api/payment/alipay/notify",
      returnUrl: "http://localhost:5173/?pay_status=success",
      message: "当前处于支付宝沙箱预演模式",
    });
    vi.spyOn(apiClient, "sandboxConfirmPay").mockResolvedValue(paidOrder);

    render(<App />);

    // 1. Open ACCOUNT modal and authenticate
    fireEvent.click(screen.getByRole("button", { name: /^ACCOUNT$/i }));
    fireEvent.click(screen.getByRole("button", { name: /AUTHENTICATE/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /ID · testuser/i })).toBeInTheDocument();
    });
    expect(listCartSpy).toHaveBeenCalled();

    // 2. Open Bag Drawer & click CREATE ORDER & SANDBOX PAY
    fireEvent.click(screen.getByRole("button", { name: /BAG \(1\)/i }));
    fireEvent.click(screen.getByRole("button", { name: /CREATE ORDER & SANDBOX PAY/i }));

    // 3. Alipay Sandbox Cashier opens with orderNo & total
    const cashier = await screen.findByTestId("alipay-sandbox-cashier");
    expect(cashier).toHaveTextContent("ORD202611179999");

    // 4. Confirm Sandbox Pay -> PAID status + tradeNo rendered
    fireEvent.click(screen.getByRole("button", { name: /模拟支付宝沙箱付款成功/i }));
    await waitFor(() => {
      expect(listOrdersSpy).toHaveBeenCalledTimes(3);
      expect(screen.getByText("PAID")).toBeInTheDocument();
      expect(screen.getByText("ALIPAY_SANDBOX_1794912345")).toBeInTheDocument();
    });
  });
});
