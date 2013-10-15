define(["lib/someComponent"], function (someComponent) {
	"use strict";

	module("someComponent");

	test("someComponent must have name", function () {
		ok(someComponent.name);
	});
});