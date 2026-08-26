def test_list_addresses(client, auth_headers):
    response = client.get("/api/addresses", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    assert data["data"][0]["city"] == "Satnali"


def test_create_and_delete_address(client, auth_headers):
    # Create new work address
    create_res = client.post(
        "/api/addresses",
        json={
            "full_name": "Test Office",
            "phone": "9876543210",
            "address_line1": "Shop #12, Market Complex",
            "address_line2": "Near Railway Station",
            "city": "Satnali",
            "state": "Haryana",
            "pincode": "123024",
            "address_type": "work",
            "is_default": False
        },
        headers=auth_headers
    )
    assert create_res.status_code == 201
    addr_id = create_res.json()["data"]["id"]

    # Delete the created address
    del_res = client.delete(f"/api/addresses/{addr_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
