import { describe, it, expect, vi } from "vitest";
import type { Response } from "express";
import { sendSuccess } from "./api-response.js";

function createMockResponse() {
    const res = {
        locals: {
            requestId: "req_test_123" as string | undefined,
        },
        status: vi.fn(),
        json: vi.fn(),
    };

    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    return res;
}

describe("sendSuccess", () => {
    it("should return a successful response with default status 200", () => {
        const res = createMockResponse();

        sendSuccess(res as unknown as Response, {
            message: "Request successful",
            data: { id: 1 },
        });

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Request successful",
            data: { id: 1 },
            requestId: "req_test_123",
        });
    });

    it("should support custom success status codes", () => {
        const res = createMockResponse();

        sendSuccess(res as unknown as Response, {
            statusCode: 201,
            message: "User created",
            data: { id: 1 },
        });

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should reject invalid status codes", () => {
        const res = createMockResponse();

        expect(() =>
            sendSuccess(res as unknown as Response, {
                statusCode: 500,
                message: "Invalid response",
                data: null,
            }),
        ).toThrow(RangeError);
    });

    it("should reject 204 No Content", () => {
        const res = createMockResponse();

        expect(() =>
            sendSuccess(res as unknown as Response, {
                statusCode: 204,
                message: "No content",
                data: null,
            }),
        ).toThrow(RangeError);
    });

    it("should return null when request ID is unavailable", () => {
        const res = createMockResponse();
        res.locals.requestId = undefined;

        sendSuccess(res as unknown as Response, {
            message: "Success",
            data: {},
        });

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                requestId: null,
            }),
        );
    });
});