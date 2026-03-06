import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/ContactForm";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("ContactForm", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID = "test123";
  });

  it("renderuje všechna pole a tlačítko", () => {
    render(<ContactForm />);
    expect(screen.getByPlaceholderText("namePlaceholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("emailPlaceholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("messagePlaceholder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });

  it("po odeslání zavolá Formspree s daty z formuláře", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("namePlaceholder"), "Jan Novák");
    await user.type(screen.getByPlaceholderText("emailPlaceholder"), "jan@test.cz");
    await user.type(screen.getByPlaceholderText("messagePlaceholder"), "Ahoj");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("formspree.io");
    expect(url).toContain("test123");
    expect(options.method).toBe("POST");
    expect(options.headers.Accept).toBe("application/json");
  });

  it("během odesílání zobrazí 'sending' a tlačítko je disabled", async () => {
    let resolve!: (v: unknown) => void;
    mockFetch.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("namePlaceholder"), "x");
    await user.type(screen.getByPlaceholderText("emailPlaceholder"), "x@x.cz");
    await user.type(screen.getByPlaceholderText("messagePlaceholder"), "x");
    user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "sending" })).toBeDisabled();
    });

    resolve({ ok: true });
  });

  it("po úspěchu zobrazí success zprávu a skryje formulář", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("namePlaceholder"), "Jan");
    await user.type(screen.getByPlaceholderText("emailPlaceholder"), "jan@test.cz");
    await user.type(screen.getByPlaceholderText("messagePlaceholder"), "Zpráva");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("success")).toBeInTheDocument());
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("po chybě zobrazí error zprávu a formulář zůstane", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("namePlaceholder"), "Jan");
    await user.type(screen.getByPlaceholderText("emailPlaceholder"), "jan@test.cz");
    await user.type(screen.getByPlaceholderText("messagePlaceholder"), "Zpráva");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });
});
