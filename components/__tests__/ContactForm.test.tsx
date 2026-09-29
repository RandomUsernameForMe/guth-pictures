import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/ContactForm";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    return t;
  },
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
    expect(screen.getByLabelText("name")).toBeInTheDocument();
    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByLabelText("message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });

  it("po odeslání zavolá Formspree s daty z formuláře", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan Novák");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "Ahoj");
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

    await user.type(screen.getByLabelText("name"), "x");
    await user.type(screen.getByLabelText("email"), "x@x.cz");
    await user.type(screen.getByLabelText("message"), "x");
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

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "Zpráva");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("success")).toBeInTheDocument());
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("po chybě zobrazí error zprávu a formulář zůstane", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "Zpráva");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });

  it("po síťové chybě zobrazí error zprávu a formulář zůstane", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "Zpráva");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });
});
